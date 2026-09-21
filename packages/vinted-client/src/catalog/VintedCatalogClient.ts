import { CatalogSearchHttpError, CatalogSearchSessionError } from "./errors.js";
import { buildCatalogSearchQuery, mapCatalogSearchResponse } from "./mappers.js";
import type { SearchItemsInput, SearchItemsResult, VintedSessionSource } from "./types.js";
import type { VintedMarket } from "../session/publicSession.js";
import type { VintedSession } from "../session/VintedSession.js";
import type { VintedRequest, VintedTransport } from "../transport/types.js";

export interface VintedCatalogClientOptions {
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

export class VintedCatalogClient {
  public constructor(private readonly options: VintedCatalogClientOptions) {}

  public async searchItems(input: SearchItemsInput): Promise<SearchItemsResult> {
    const session = await resolveSession(this.options.session);
    const cookie = createCookieHeader(session.cookies);
    if (cookie.length === 0) {
      throw new CatalogSearchSessionError();
    }

    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*",
      cookie
    };

    if (session.locale !== undefined) {
      headers["accept-language"] = session.locale;
    }
    if (session.anonId !== undefined) {
      headers["x-anon-id"] = session.anonId;
    }

    const request: VintedRequest = {
      method: "GET",
      host: "api",
      hostname: new URL(this.options.market.apiBaseUrl).hostname,
      path: "/svc-catalogue/items",
      query: buildCatalogSearchQuery(input),
      headers
    };

    if (this.options.timeoutMs !== undefined) {
      request.timeoutMs = this.options.timeoutMs;
    }

    const response = await this.options.transport.request<unknown>(request);

    if (response.status !== 200) {
      throw new CatalogSearchHttpError(response.status, response.statusText);
    }

    return mapCatalogSearchResponse(response.data);
  }
}
