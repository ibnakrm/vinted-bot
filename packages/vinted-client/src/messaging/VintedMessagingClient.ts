import { ConversationHttpError, MessageThreadsHttpError, MessageThreadsSessionError, SendMessageHttpError } from "./errors.js";
import {
  buildConversationPath,
  buildMessageThreadsQuery,
  buildSendMessagePath,
  buildSendMessagePayload,
  mapConversationResponse,
  mapMessageThreadsResponse,
  mapSentMessageResponse
} from "./mappers.js";
import type { ListMessageThreadsInput, ListMessageThreadsResult, SendMessageInput, VintedConversation, VintedSentMessage } from "./types.js";
import { hasSessionMaterial, type VintedMarket } from "../session/publicSession.js";
import type { VintedSession, VintedSessionSource } from "../session/VintedSession.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";

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

function createMessagingDiagnostics(overrides: {
  includeRequestBodyPreview?: boolean;
  includeResponseBodyPreview?: boolean;
}): NonNullable<VintedRequest["diagnostics"]> {
  const diagnostics: NonNullable<VintedRequest["diagnostics"]> = {
    includeResponseBodyPreview: overrides.includeResponseBodyPreview ?? false
  };

  if (overrides.includeRequestBodyPreview !== undefined) {
    diagnostics.includeRequestBodyPreview = overrides.includeRequestBodyPreview;
  }

  return diagnostics;
}

export class VintedMessagingClient {
  public constructor(private readonly options: VintedMessagingClientOptions) {}

  public async listMessageThreads(input: ListMessageThreadsInput = {}): Promise<ListMessageThreadsResult> {
    const response = await this.requestMessagingEndpoint("/messaging/main/inbox", buildMessageThreadsQuery(input));
    if (response.status !== 200) {
      throw new MessageThreadsHttpError(response.status, response.statusText);
    }

    return mapMessageThreadsResponse(response.data);
  }

  public async getConversation(conversationId: string | number): Promise<VintedConversation> {
    const response = await this.requestMessagingEndpoint(buildConversationPath(conversationId));
    if (response.status !== 200) {
      throw new ConversationHttpError(response.status, response.statusText);
    }

    return mapConversationResponse(response.data);
  }

  public async sendMessage(input: SendMessageInput): Promise<VintedSentMessage> {
    const response = await this.requestMessagingEndpoint(buildSendMessagePath(input.conversationId), {}, {
      method: "POST",
      body: buildSendMessagePayload(input),
      contentType: "application/json",
      includeRequestBodyPreview: false,
      includeResponseBodyPreview: false
    });
    if (response.status !== 201) {
      throw new SendMessageHttpError(response.status, response.statusText);
    }

    return mapSentMessageResponse(response.data);
  }

  private async requestMessagingEndpoint(
    path: string,
    query: VintedRequest["query"] = {},
    overrides: {
      method?: VintedRequest["method"];
      body?: unknown;
      contentType?: string;
      includeRequestBodyPreview?: boolean;
      includeResponseBodyPreview?: boolean;
    } = {}
  ): Promise<VintedResponse<unknown>> {
    const session = await resolveSession(this.options.session);
    if (!hasSessionMaterial(session)) {
      throw new MessageThreadsSessionError();
    }

    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*"
    };
    if (overrides.contentType !== undefined) {
      headers["content-type"] = overrides.contentType;
    }
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
      method: overrides.method ?? "GET",
      host: "api",
      hostname: new URL(this.options.market.apiBaseUrl).hostname,
      path,
      query,
      headers,
      body: overrides.body,
      diagnostics: createMessagingDiagnostics(overrides)
    };

    if (this.options.timeoutMs !== undefined) {
      request.timeoutMs = this.options.timeoutMs;
    }

    return this.options.transport.request<unknown>(request);
  }
}
