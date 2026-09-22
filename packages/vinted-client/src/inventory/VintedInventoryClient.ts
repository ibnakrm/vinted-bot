import { OwnInventoryHttpError, OwnInventorySessionError } from "./errors.js";
import { buildOwnInventoryQuery, mapOwnInventoryResponse } from "./mappers.js";
import type { OwnInventoryInput, OwnInventoryResult } from "./types.js";
import { hasSessionMaterial, type VintedMarket } from "../session/publicSession.js";
import type { VintedSession, VintedSessionSource } from "../session/VintedSession.js";
import type { VintedRequest, VintedTransport } from "../transport/types.js";

export interface VintedInventoryClientOptions {
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

function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export class VintedInventoryClient {
  public constructor(private readonly options: VintedInventoryClientOptions) {}

  public async getOwnInventory(input: OwnInventoryInput): Promise<OwnInventoryResult> {
    const session = await resolveSession(this.options.session);
    if (!hasSessionMaterial(session)) {
      throw new OwnInventorySessionError();
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
      host: "site",
      hostname: new URL(this.options.market.siteBaseUrl).hostname,
      path: `/api/v2/wardrobe/${encodePathSegment(input.userId)}/items`,
      query: buildOwnInventoryQuery(input),
      headers
    };

    if (this.options.timeoutMs !== undefined) {
      request.timeoutMs = this.options.timeoutMs;
    }

    const response = await this.options.transport.request<unknown>(request);
    if (response.status !== 200) {
      throw new OwnInventoryHttpError(response.status, response.statusText);
    }

    return mapOwnInventoryResponse(response.data);
  }
}
