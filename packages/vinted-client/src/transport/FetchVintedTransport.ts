import type { VintedRequest, VintedResponse, VintedTransport } from "./types.js";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export interface FetchVintedTransportConfig {
  siteBaseUrl: string;
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
}

function appendQuery(url: URL, query: VintedRequest["query"]): void {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
}

function headersToRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

function getSetCookie(headers: Headers): string[] {
  const withSetCookie = headers as HeadersWithSetCookie;
  if (typeof withSetCookie.getSetCookie === "function") {
    return withSetCookie.getSetCookie();
  }

  const single = headers.get("set-cookie");
  return single === null ? [] : [single];
}

export class FetchVintedTransport implements VintedTransport {
  private readonly fetchImpl: typeof fetch;

  public constructor(private readonly config: FetchVintedTransportConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  public async request<T>(request: VintedRequest): Promise<VintedResponse<T>> {
    const baseUrl = request.host === "site" ? this.config.siteBaseUrl : this.config.apiBaseUrl;
    const url = new URL(request.path, baseUrl);
    appendQuery(url, request.query);

    const init: RequestInit = {
      method: request.method,
      redirect: "follow"
    };
    if (request.headers !== undefined) {
      init.headers = request.headers;
    }
    if (request.body !== undefined) {
      init.body = JSON.stringify(request.body);
    }
    if (request.timeoutMs !== undefined) {
      init.signal = AbortSignal.timeout(request.timeoutMs);
    }

    const response = await this.fetchImpl(url, init);
    const contentType = response.headers.get("content-type") ?? "";
    const data = (contentType.includes("application/json") ? await response.json() : await response.text()) as T;

    const result: VintedResponse<T> = {
      status: response.status,
      statusText: response.statusText,
      headers: headersToRecord(response.headers),
      setCookie: getSetCookie(response.headers),
      data,
      finalUrl: response.url,
      redirected: response.redirected
    };
    if (request.requestId !== undefined) {
      result.requestId = request.requestId;
    }
    return result;
  }
}
