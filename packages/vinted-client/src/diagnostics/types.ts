import type { VintedHostClass, VintedHttpMethod } from "../transport/types.js";

export type DiagnosticBodyKind = "empty" | "json" | "text" | "binary" | "unknown";

export interface DiagnosticBodyMetadata {
  kind: DiagnosticBodyKind;
  sizeBytes?: number;
  preview?: unknown;
}

export interface HttpRequestDiagnostic {
  timestamp: string;
  method: VintedHttpMethod;
  host: VintedHostClass;
  hostname?: string;
  path: string;
  query: Readonly<Record<string, unknown>>;
  headers: Readonly<Record<string, unknown>>;
  body: DiagnosticBodyMetadata;
  correlationId: string;
}

export interface HttpResponseDiagnostic {
  status: number;
  statusText?: string;
  finalUrl?: string;
  redirected?: boolean;
  headers: Readonly<Record<string, unknown>>;
  contentType?: string;
  bodySizeBytes?: number;
  body: DiagnosticBodyMetadata;
  durationMs: number;
  correlationId: string;
}

export interface HttpErrorDiagnostic {
  name: string;
  message: string;
}

export interface HttpExchangeDiagnostic {
  kind: "http";
  request: HttpRequestDiagnostic;
  response?: HttpResponseDiagnostic;
  error?: HttpErrorDiagnostic;
}

export interface DiagnosticSink {
  write(entry: HttpExchangeDiagnostic): void | Promise<void>;
}

export interface DiagnosticTransportOptions {
  includeJsonPreview?: boolean;
  maxPreviewKeys?: number;
}
