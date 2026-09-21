import { describe, expect, it } from "vitest";

import {
  redactDiagnosticText,
  redactDiagnosticUrl,
  redactDiagnosticValue,
  redactHeaders,
  redactObject
} from "./redact.js";

describe("diagnostic redaction", () => {
  it("redacts sensitive headers without changing safe headers", () => {
    expect(
      redactHeaders({
        authorization: "Bearer real-token",
        cookie: "sessionid=real-cookie",
        "set-cookie": "sessionid=real-cookie",
        "accept-language": "fr-FR"
      })
    ).toEqual({
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
      "set-cookie": "[REDACTED]",
      "accept-language": "fr-FR"
    });
  });

  it("redacts nested session-like fields", () => {
    expect(
      redactObject({
        account: {
          sessionToken: "secret",
          csrfToken: "csrf",
          refreshToken: "refresh",
          sessionId: "session-id",
          username: "demo-user"
        },
        requestId: "req_123"
      })
    ).toEqual({
      account: {
        sessionToken: "[REDACTED]",
        csrfToken: "[REDACTED]",
        refreshToken: "[REDACTED]",
        sessionId: "[REDACTED]",
        username: "demo-user"
      },
      requestId: "req_123"
    });
  });

  it("redacts sensitive headers regardless of casing", () => {
    expect(
      redactHeaders({
        Authorization: "Bearer real-token",
        COOKIE: "sessionid=real-cookie",
        "X-CSRF-Token": "csrf-token",
        "x-access-token": "access-token",
        "x-v-udt": "udt-token"
      })
    ).toEqual({
      Authorization: "[REDACTED]",
      COOKIE: "[REDACTED]",
      "X-CSRF-Token": "[REDACTED]",
      "x-access-token": "[REDACTED]",
      "x-v-udt": "[REDACTED]"
    });
  });

  it("redacts anonymous IDs because they can identify a session context", () => {
    expect(redactDiagnosticValue("X-Anon-Id", "anon-real-value")).toBe("[REDACTED]");
  });

  it("redacts sensitive query params in diagnostic URLs while keeping safe params", () => {
    expect(redactDiagnosticUrl("https://api.vinted.fr/svc-catalogue/items?token=abc&session_id=xyz&page=1")).toBe(
      "https://api.vinted.fr/svc-catalogue/items?token=[REDACTED]&session_id=[REDACTED]&page=1"
    );
  });

  it("redacts secrets embedded in diagnostic text", () => {
    expect(redactDiagnosticText("request failed cookie=session-secret token=abc Bearer live-token page=1")).toBe(
      "request failed cookie=[REDACTED] token=[REDACTED] Bearer [REDACTED] page=1"
    );
  });
});
