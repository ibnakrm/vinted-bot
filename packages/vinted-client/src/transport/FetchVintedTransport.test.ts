import { describe, expect, it } from "vitest";

import { FetchVintedTransport } from "./FetchVintedTransport.js";

interface FetchCall {
  input: URL | RequestInfo;
  init: RequestInit | undefined;
}

function jsonResponse(value: unknown, options: Partial<Response> = {}): Response {
  const headers = new Headers(options.headers ?? { "content-type": "application/json", "x-response": "yes" });
  return {
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    headers,
    url: options.url ?? "https://api.vinted.fr/svc-catalogue/items",
    redirected: options.redirected ?? false,
    json: () => Promise.resolve(value),
    text: () => Promise.resolve(JSON.stringify(value))
  } as Response;
}

function textResponse(value: string, options: Partial<Response> = {}): Response {
  const headers = new Headers(options.headers ?? { "content-type": "text/plain" });
  return {
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    headers,
    url: options.url ?? "https://www.vinted.fr/",
    redirected: options.redirected ?? false,
    json: () => Promise.resolve(JSON.parse(value)),
    text: () => Promise.resolve(value)
  } as Response;
}

function responseWithSetCookie(setCookie: readonly string[]): Response {
  const headers = new Headers({ "content-type": "text/html" }) as Headers & { getSetCookie: () => string[] };
  headers.getSetCookie = () => [...setCookie];

  return {
    status: 200,
    statusText: "OK",
    headers,
    url: "https://www.vinted.fr/",
    redirected: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve("<html></html>")
  } as Response;
}

function inputUrl(input: URL | RequestInfo): string {
  if (input instanceof URL) {
    return input.href;
  }

  if (typeof input === "string") {
    return input;
  }

  return input.url;
}

describe("FetchVintedTransport", () => {
  it("selects the site host", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl: typeof fetch = (input, init) => {
      calls.push({ input, init });
      return Promise.resolve(textResponse("ok"));
    };
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl
    });

    await transport.request({ method: "GET", host: "site", path: "/" });

    expect(calls[0] === undefined ? undefined : inputUrl(calls[0].input)).toBe("https://www.vinted.fr/");
  });

  it("selects the api host and appends query strings", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl: typeof fetch = (input, init) => {
      calls.push({ input, init });
      return Promise.resolve(jsonResponse({ items: [] }));
    };
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl
    });

    await transport.request({
      method: "GET",
      host: "api",
      path: "/svc-catalogue/items",
      query: {
        search_text: "polo Lacoste",
        page: 1,
        ignored: undefined
      }
    });

    expect(calls[0] === undefined ? undefined : inputUrl(calls[0].input)).toBe(
      "https://api.vinted.fr/svc-catalogue/items?search_text=polo+Lacoste&page=1"
    );
  });

  it("passes headers and JSON body to fetch", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl: typeof fetch = (input, init) => {
      calls.push({ input, init });
      return Promise.resolve(jsonResponse({ ok: true }));
    };
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl
    });

    await transport.request({
      method: "POST",
      host: "api",
      path: "/test",
      headers: {
        accept: "application/json",
        "x-request": "req"
      },
      body: {
        ok: true
      }
    });

    expect(calls[0]?.init).toMatchObject({
      method: "POST",
      headers: {
        accept: "application/json",
        "x-request": "req"
      },
      body: JSON.stringify({ ok: true })
    });
  });

  it("parses JSON responses", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () => Promise.resolve(jsonResponse({ items: [] }))
    });

    await expect(transport.request({ method: "GET", host: "api", path: "/items" })).resolves.toMatchObject({
      data: { items: [] },
      headers: {
        "content-type": "application/json",
        "x-response": "yes"
      }
    });
  });

  it("parses text responses", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () => Promise.resolve(textResponse("plain response"))
    });

    await expect(transport.request({ method: "GET", host: "site", path: "/" })).resolves.toMatchObject({
      data: "plain response"
    });
  });

  it("propagates requestId", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () => Promise.resolve(jsonResponse({ ok: true }))
    });

    await expect(
      transport.request({ method: "GET", host: "api", path: "/items", requestId: "req-transport" })
    ).resolves.toMatchObject({
      requestId: "req-transport"
    });
  });

  it("returns redirect metadata and final URL", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () =>
        Promise.resolve(
          textResponse("redirected", {
            url: "https://www.vinted.fr/catalog",
            redirected: true
          })
        )
    });

    await expect(transport.request({ method: "GET", host: "site", path: "/" })).resolves.toMatchObject({
      finalUrl: "https://www.vinted.fr/catalog",
      redirected: true
    });
  });

  it("returns Set-Cookie headers when available", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () => Promise.resolve(responseWithSetCookie(["v_udt=secret; Path=/", "anon_id=secret; Path=/"]))
    });

    await expect(transport.request({ method: "GET", host: "site", path: "/" })).resolves.toMatchObject({
      setCookie: ["v_udt=secret; Path=/", "anon_id=secret; Path=/"]
    });
  });

  it("creates an AbortSignal when timeoutMs is provided", async () => {
    const calls: FetchCall[] = [];
    const fetchImpl: typeof fetch = (input, init) => {
      calls.push({ input, init });
      return Promise.resolve(jsonResponse({ ok: true }));
    };
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl
    });

    await transport.request({ method: "GET", host: "api", path: "/items", timeoutMs: 500 });

    expect(calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("preserves non-2xx statuses without masking them", async () => {
    const transport = new FetchVintedTransport({
      siteBaseUrl: "https://www.vinted.fr",
      apiBaseUrl: "https://api.vinted.fr",
      fetchImpl: () =>
        Promise.resolve(
          jsonResponse(
            { error: "forbidden" },
            {
              status: 403,
              statusText: "Forbidden"
            }
          )
        )
    });

    await expect(transport.request({ method: "GET", host: "api", path: "/items" })).resolves.toMatchObject({
      status: 403,
      statusText: "Forbidden",
      data: {
        error: "forbidden"
      }
    });
  });
});
