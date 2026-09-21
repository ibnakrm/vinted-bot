export type RedactedValue = "[REDACTED]";

const REDACTED: RedactedValue = "[REDACTED]";
const REDACTED_URL_VALUE = REDACTED;

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

const SENSITIVE_TEXT_KEY_PATTERN =
  /\b(authorization|cookie|set-cookie|x-csrf-token|csrf-token|csrf|x-access-token|access-token|refresh-token|session|session-id|session_id|token|secret|password|jwt|anon-id|anon_id|x-anon-id)\b\s*[:=]\s*([^,\s&;]+)/gi;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll("-", "").replaceAll("_", "");
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part.replaceAll("_", "")));
}

export function isSensitiveDiagnosticKey(key: string): boolean {
  return isSensitiveKey(key);
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

export function redactDiagnosticText(value: string): string {
  return value
    .replaceAll(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replaceAll(SENSITIVE_TEXT_KEY_PATTERN, (_match, key: string) => `${key}=${REDACTED}`);
}

export function redactDiagnosticUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return redactDiagnosticText(value);
  }

  const queryParts: string[] = [];
  for (const [key, queryValue] of url.searchParams.entries()) {
    queryParts.push(
      `${encodeURIComponent(key)}=${isSensitiveKey(key) ? REDACTED_URL_VALUE : encodeURIComponent(queryValue)}`
    );
  }

  const query = queryParts.join("&");
  return `${url.protocol}//${url.host}${url.pathname}${query.length > 0 ? `?${query}` : ""}`;
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
