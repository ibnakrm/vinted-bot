import { describe, expect, it } from "vitest";

import {
  acquirePublicSession,
  createSessionFromPublicResponse,
  extractCsrfToken,
  extractHtmlLocale,
  isSessionEmpty,
  isSessionUsable,
  parseSetCookieHeaders,
  parseVintedMarketUrl
} from "./publicSession.js";
import {
  InvalidMarketUrlError,
  MissingUsableSessionInformationError,
  PublicSessionNetworkError,
  UnexpectedSessionStatusError
} from "./errors.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";
import sanitisedResponseFixture from "./__fixtures__/public-session-response.sanitised.json" with { type: "json" };

class StubTransport implements VintedTransport {
  public readonly requests: VintedRequest[] = [];

  public constructor(private readonly response: VintedResponse<string>) {}

  public request<T>(request: VintedRequest): Promise<VintedResponse<T>> {
    this.requests.push(request);
    return Promise.resolve({
      ...this.response,
      requestId: request.requestId
    } as VintedResponse<T>);
  }
}

function publicResponse(overrides: Partial<VintedResponse<string>> = {}): VintedResponse<string> {
  return {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-anon-id": "anon-live"
    },
    setCookie: ["v_udt=cookie-live; Path=/; HttpOnly", "anon_id=anon-cookie; Path=/"],
    data: '<!doctype html><html lang="fr"><head></head><body>ok</body></html>',
    finalUrl: "https://www.vinted.fr/",
    redirected: false,
    ...overrides
  };
}

describe("public session parsing", () => {
  it("parses a sanitised public-session response fixture", () => {
    const session = createSessionFromPublicResponse(
      sanitisedResponseFixture,
      new Date("2026-09-21T09:00:00.000Z")
    );

    expect(session).toMatchObject({
      cookies: {
        v_udt: "[REDACTED]",
        anon_id: "[REDACTED]"
      },
      anonId: "[REDACTED]",
      locale: "fr-FR",
      acquiredAt: "2026-09-21T09:00:00.000Z"
    });
    expect(isSessionUsable(session)).toBe(true);
  });

  it("parses Set-Cookie headers into cookie name/value pairs", () => {
    expect(parseSetCookieHeaders(["v_udt=value-one; Path=/; HttpOnly", "foo=bar=baz; Secure"])).toEqual({
      v_udt: "value-one",
      foo: "bar=baz"
    });
  });

  it("extracts X-Anon-Id from response headers", () => {
    const session = createSessionFromPublicResponse(publicResponse(), new Date("2026-09-21T09:00:00.000Z"));

    expect(session.anonId).toBe("anon-live");
  });

  it("extracts locale from html lang", () => {
    expect(extractHtmlLocale('<html data-controller="x" lang="it">')).toBe("it");
  });

  it("supports missing CSRF token", () => {
    expect(extractCsrfToken("<html><head></head></html>")).toBeUndefined();
  });

  it("extracts optional CSRF token when present", () => {
    expect(extractCsrfToken('<meta name="csrf-token" content="csrf-live">')).toBe("csrf-live");
    expect(extractCsrfToken('<meta content="csrf-live" name="csrf-token">')).toBe("csrf-live");
  });

  it("classifies partial and unusable sessions", () => {
    expect(
      isSessionUsable({
        cookies: {},
        anonId: "anon-live",
        acquiredAt: "2026-09-21T09:00:00.000Z"
      })
    ).toBe(true);
    expect(
      isSessionEmpty({
        cookies: {},
        acquiredAt: "2026-09-21T09:00:00.000Z"
      })
    ).toBe(true);
    expect(
      isSessionUsable({
        cookies: {},
        locale: "fr",
        acquiredAt: "2026-09-21T09:00:00.000Z"
      })
    ).toBe(false);
  });

  it("parses market URLs without hardcoding .fr", () => {
    expect(parseVintedMarketUrl("https://www.vinted.it/catalog")).toEqual({
      siteBaseUrl: "https://www.vinted.it",
      apiBaseUrl: "https://api.vinted.it",
      hostname: "www.vinted.it",
      market: "IT"
    });
    expect(() => parseVintedMarketUrl("https://example.com")).toThrow(InvalidMarketUrlError);
  });
});

describe("acquirePublicSession", () => {
  it("returns public session metadata and records redirects", async () => {
    const transport = new StubTransport(
      publicResponse({
        finalUrl: "https://www.vinted.de/",
        redirected: true,
        data: '<html lang="de"><head><meta name="csrf-token" content="csrf-live"></head></html>'
      })
    );

    const result = await acquirePublicSession({
      marketUrl: "https://www.vinted.de",
      transport,
      now: () => new Date("2026-09-21T09:00:00.000Z")
    });

    expect(result.market.market).toBe("DE");
    expect(result.redirected).toBe(true);
    expect(result.finalUrl).toBe("https://www.vinted.de/");
    expect(result.contentType).toBe("text/html; charset=utf-8");
    expect(result.session).toMatchObject({
      cookies: {
        v_udt: "cookie-live",
        anon_id: "anon-cookie"
      },
      anonId: "anon-live",
      csrfToken: "csrf-live",
      locale: "de",
      acquiredAt: "2026-09-21T09:00:00.000Z"
    });
    expect(result.diagnostics[0]?.request.host).toBe("site");
    expect(result.diagnostics[0]?.response?.redirected).toBe(true);
  });

  it("throws on network errors", async () => {
    const transport: VintedTransport = {
      request<T>(): Promise<VintedResponse<T>> {
        return Promise.reject(new Error("network down"));
      }
    };

    await expect(acquirePublicSession({ marketUrl: "https://www.vinted.fr", transport })).rejects.toThrow(
      PublicSessionNetworkError
    );
  });

  it("throws on unexpected status", async () => {
    await expect(
      acquirePublicSession({
        marketUrl: "https://www.vinted.fr",
        transport: new StubTransport(publicResponse({ status: 403, statusText: "Forbidden" }))
      })
    ).rejects.toThrow(UnexpectedSessionStatusError);
  });

  it("throws when no usable identity material is present", async () => {
    await expect(
      acquirePublicSession({
        marketUrl: "https://www.vinted.fr",
        transport: new StubTransport(
          publicResponse({
            headers: { "content-type": "text/html" },
            setCookie: [],
            data: '<html lang="fr"></html>'
          })
        )
      })
    ).rejects.toThrow(MissingUsableSessionInformationError);
  });

  it("does not leak secrets in diagnostics", async () => {
    const result = await acquirePublicSession({
      marketUrl: "https://www.vinted.fr",
      transport: new StubTransport(publicResponse()),
      now: () => new Date("2026-09-21T09:00:00.000Z")
    });

    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain("cookie-live");
    expect(serialized).not.toContain("anon-cookie");
    expect(serialized).toContain("[REDACTED]");
  });
});
