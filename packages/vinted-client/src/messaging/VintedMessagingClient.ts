import { MessageThreadsHttpError, MessageThreadsSessionError } from "./errors.js";
import { buildMessageThreadsQuery, mapMessageThreadsResponse } from "./mappers.js";
import type { ListMessageThreadsInput, ListMessageThreadsResult } from "./types.js";
import { hasSessionMaterial, type VintedMarket } from "../session/publicSession.js";
import type { VintedSession, VintedSessionSource } from "../session/VintedSession.js";
import type { VintedRequest, VintedTransport } from "../transport/types.js";

export interface VintedMessagingClientOptions {
  market: VintedMarket;
  transport: VintedTransport;
  session: VintedSessionSource;
  timeoutMs?: number;
}

async function resolveSession(source: VintedSessionSource): Promise<VintedSession> {
  if (typeof source === "function") {
    return source();
  }

  if ("getSession" in source) {
    return source.getSession();
  }

  return source;
}

function createCookieHeader(cookies: Readonly<Record<string, string>>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export class VintedMessagingClient {
  public constructor(private readonly options: VintedMessagingClientOptions) {}

  public async listMessageThreads(input: ListMessageThreadsInput = {}): Promise<ListMessageThreadsResult> {
    const session = await resolveSession(this.options.session);
    if (!hasSessionMaterial(session)) {
      throw new MessageThreadsSessionError();
    }

    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*"
    };
    const cookie = createCookieHeader(session.cookies);
    if (cookie.length > 0) {
      headers.cookie = cookie;
    }
    if (session.locale !== undefined) {
      headers["accept-language"] = session.locale;
      headers.locale = session.locale;
    }
    if (session.anonId !== undefined) {
      headers["x-anon-id"] = session.anonId;
    }
    if (session.csrfToken !== undefined) {
      headers["x-csrf-token"] = session.csrfToken;
    }

    const request: VintedRequest = {
      method: "GET",
      host: "api",
      hostname: new URL(this.options.market.apiBaseUrl).hostname,
      path: "/messaging/main/inbox",
      query: buildMessageThreadsQuery(input),
      headers,
      diagnostics: {
        includeResponseBodyPreview: false
      }
    };

    if (this.options.timeoutMs !== undefined) {
      request.timeoutMs = this.options.timeoutMs;
    }

    const response = await this.options.transport.request<unknown>(request);
    if (response.status !== 200) {
      throw new MessageThreadsHttpError(response.status, response.statusText);
    }

    return mapMessageThreadsResponse(response.data);
  }
}
