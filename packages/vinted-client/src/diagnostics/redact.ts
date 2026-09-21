export type RedactedValue = "[REDACTED]";

const REDACTED: RedactedValue = "[REDACTED]";

const SENSITIVE_KEY_PARTS = [
  "authorization",
  "cookie",
  "setcookie",
  "csrf",
  "xcsrftoken",
  "csrftoken",
  "xaccesstoken",
  "accesstoken",
  "refreshtoken",
  "token",
  "secret",
  "session",
  "sessionid",
  "password",
  "jwt",
  "anonid",
  "anon_id",
  "udt"
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll("-", "").replaceAll("_", "");
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part.replaceAll("_", "")));
}

export function redactDiagnosticValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (value !== null && typeof value === "object") {
    return redactObject(value);
  }

  return value;
}

export function redactHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, redactDiagnosticValue(key, value) as string])
  );
}

export function redactObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      redactDiagnosticValue(key, nestedValue)
    ])
  );
}
