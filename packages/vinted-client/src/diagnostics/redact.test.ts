import { describe, expect, it } from "vitest";

import { redactDiagnosticValue, redactHeaders, redactObject } from "./redact.js";

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
});
