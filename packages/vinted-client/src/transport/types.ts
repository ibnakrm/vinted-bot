export type VintedHostClass = "site" | "api";

export type VintedHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface VintedRequestDiagnostics {
  includeResponseBodyPreview?: boolean;
}

export interface VintedRequest {
  method: VintedHttpMethod;
  host: VintedHostClass;
  hostname?: string;
  path: string;
  query?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  headers?: Readonly<Record<string, string>>;
  body?: unknown;
  timeoutMs?: number;
  requestId?: string;
  diagnostics?: VintedRequestDiagnostics;
}

export interface VintedResponse<T> {
  status: number;
  statusText?: string;
  headers: Readonly<Record<string, string>>;
  setCookie?: readonly string[];
  data: T;
  requestId?: string;
  finalUrl?: string;
  redirected?: boolean;
}

export interface VintedTransport {
  request<T>(request: VintedRequest): Promise<VintedResponse<T>>;
}
