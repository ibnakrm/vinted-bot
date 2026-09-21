import { describe, expect, it } from "vitest";

import { DiagnosticTransport } from "./DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "./sinks.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";

const rawSecrets = [
  "Bearer live-token",
  "sessionid=live-cookie",
  "csrf-live",
  "nested-session-token",
  "refresh-live",
  "access-live"
];

class StubTransport implements VintedTransport {
  public constructor(private readonly response: VintedResponse<unknown>) {}

  public request<T>(request: VintedRequest): Promise<VintedResponse<T>> {
    return Promise.resolve({
      ...this.response,
      requestId: request.requestId
    } as VintedResponse<T>);
  }
}

describe("DiagnosticTransport", () => {
  it("correlates request and response diagnostics while preserving non-sensitive data", async () => {
    const sink = new MemoryDiagnosticSink();
    const transport = new DiagnosticTransport(
      new StubTransport({
        status: 200,
        statusText: "OK",
        headers: {
        "content-type": "application/json",
        "set-cookie": "sessionid=live-cookie",
        "content-length": "88"
      },
      finalUrl: "https://api.vinted.fr/svc-catalogue/items?token=access-live&session_id=nested-session-token&page=1",
      data: {
          ok: true,
          nested: {
            refreshToken: "refresh-live",
            publicField: "visible"
          }
        }
      }),
      sink,
      { includeJsonPreview: true }
    );

    await transport.request({
      method: "GET",
      host: "api",
      hostname: "api.vinted.example",
      path: "/svc-catalogue/items",
      query: {
        search_text: "polo",
        accessToken: "access-live"
      },
      headers: {
        Authorization: "Bearer live-token",
        COOKIE: "sessionid=live-cookie",
        "X-CSRF-Token": "csrf-live",
        "accept-language": "fr-FR"
      },
      body: {
        nested: {
          sessionToken: "nested-session-token",
          safe: "kept"
        }
      },
      requestId: "req_test_1"
    });

    expect(sink.entries).toHaveLength(1);
    const [entry] = sink.entries;

    expect(entry?.request.correlationId).toBe("req_test_1");
    expect(entry?.response?.correlationId).toBe("req_test_1");
    expect(entry?.request.host).toBe("api");
    expect(entry?.request.hostname).toBe("api.vinted.example");
    expect(entry?.request.headers).toMatchObject({
      Authorization: "[REDACTED]",
      COOKIE: "[REDACTED]",
      "X-CSRF-Token": "[REDACTED]",
      "accept-language": "fr-FR"
    });
    expect(entry?.request.query).toMatchObject({
      search_text: "polo",
      accessToken: "[REDACTED]"
    });
    expect(entry?.request.body.kind).toBe("json");
    expect(typeof entry?.request.body.sizeBytes).toBe("number");
    expect(entry?.response).toMatchObject({
      status: 200,
      statusText: "OK",
      finalUrl: "https://api.vinted.fr/svc-catalogue/items?token=[REDACTED]&session_id=[REDACTED]&page=1",
      contentType: "application/json",
      bodySizeBytes: 88,
      headers: {
        "content-type": "application/json",
        "set-cookie": "[REDACTED]",
        "content-length": "88"
      }
    });
    expect(entry?.response?.body.preview).toEqual({
      ok: true,
      nested: {
        refreshToken: "[REDACTED]",
        publicField: "visible"
      }
    });
  });

  it("distinguishes site and api host classes without hardcoded markets", async () => {
    const siteSink = new MemoryDiagnosticSink();
    const apiSink = new MemoryDiagnosticSink();
    const response = {
      status: 204,
      headers: {},
      data: null
    };

    await new DiagnosticTransport(new StubTransport(response), siteSink).request({
      method: "GET",
      host: "site",
      hostname: "www.vinted.test-market",
      path: "/",
      requestId: "site-request"
    });
    await new DiagnosticTransport(new StubTransport(response), apiSink).request({
      method: "GET",
      host: "api",
      hostname: "api.vinted.test-market",
      path: "/svc-catalogue/items",
      requestId: "api-request"
    });

    expect(siteSink.entries[0]?.request.host).toBe("site");
    expect(siteSink.entries[0]?.request.hostname).toBe("www.vinted.test-market");
    expect(apiSink.entries[0]?.request.host).toBe("api");
    expect(apiSink.entries[0]?.request.hostname).toBe("api.vinted.test-market");
  });

  it("does not emit raw secrets in serialized diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const transport = new DiagnosticTransport(
      new StubTransport({
        status: 403,
        statusText: "Forbidden",
        headers: {
          "Set-Cookie": "sessionid=live-cookie"
        },
        data: {
          csrfToken: "csrf-live",
          message: "forbidden"
        }
      }),
      sink,
      { includeJsonPreview: true }
    );

    await transport.request({
      method: "POST",
      host: "site",
      hostname: "www.vinted.example",
      path: "/private",
      headers: {
        authorization: "Bearer live-token",
        cookie: "sessionid=live-cookie"
      },
      body: {
        password: "nested-session-token"
      },
      requestId: "no-secret-output"
    });

    const serialized = JSON.stringify(sink.entries);
    for (const secret of rawSecrets) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain("forbidden");
  });

  it("emits a correlated diagnostic when the wrapped transport throws", async () => {
    const sink = new MemoryDiagnosticSink();
    const failingTransport: VintedTransport = {
      request<T>(): Promise<VintedResponse<T>> {
        return Promise.reject(new Error("HTTP 429"));
      }
    };
    const transport = new DiagnosticTransport(failingTransport, sink);

    await expect(
      transport.request({
        method: "GET",
        host: "api",
        hostname: "api.vinted.any-market",
        path: "/svc-catalogue/items",
        requestId: "error-request"
      })
    ).rejects.toThrow("HTTP 429");

    expect(sink.entries[0]).toMatchObject({
      kind: "http",
      request: {
        correlationId: "error-request"
      },
      error: {
        name: "Error",
        message: "HTTP 429"
      }
    });
  });

  it("sanitizes thrown error messages before emitting diagnostics", async () => {
    const sink = new MemoryDiagnosticSink();
    const failingTransport: VintedTransport = {
      request<T>(): Promise<VintedResponse<T>> {
        return Promise.reject(new Error("request failed cookie=session-secret token=abc Bearer live-token"));
      }
    };
    const transport = new DiagnosticTransport(failingTransport, sink);

    await expect(
      transport.request({
        method: "GET",
        host: "api",
        path: "/svc-catalogue/items",
        requestId: "secret-error"
      })
    ).rejects.toThrow("session-secret");

    const serialized = JSON.stringify(sink.entries);
    expect(serialized).not.toContain("session-secret");
    expect(serialized).not.toContain("abc");
    expect(serialized).not.toContain("live-token");
    expect(sink.entries[0]?.error?.message).toBe(
      "request failed cookie=[REDACTED] token=[REDACTED] Bearer [REDACTED]"
    );
  });
});
