import { redactObject } from "./redact.js";
import type { DiagnosticBodyMetadata, DiagnosticTransportOptions } from "./types.js";

const DEFAULT_MAX_PREVIEW_KEYS = 20;

function byteSize(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function jsonPreview(value: unknown, maxPreviewKeys: number): unknown {
  const redacted = redactObject(value);

  if (Array.isArray(redacted)) {
    return redacted.slice(0, maxPreviewKeys);
  }

  if (redacted !== null && typeof redacted === "object") {
    return Object.fromEntries(Object.entries(redacted).slice(0, maxPreviewKeys));
  }

  return redacted;
}

export function createBodyMetadata(value: unknown, options: DiagnosticTransportOptions = {}): DiagnosticBodyMetadata {
  if (value === undefined || value === null) {
    return { kind: "empty", sizeBytes: 0 };
  }

  if (typeof value === "string") {
    return {
      kind: "text",
      sizeBytes: byteSize(value)
    };
  }

  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    return {
      kind: "binary",
      sizeBytes: value.byteLength
    };
  }

  if (typeof value === "object" || Array.isArray(value)) {
    const metadata: DiagnosticBodyMetadata = {
      kind: "json",
      sizeBytes: byteSize(JSON.stringify(value))
    };

    if (options.includeJsonPreview === true) {
      metadata.preview = jsonPreview(value, options.maxPreviewKeys ?? DEFAULT_MAX_PREVIEW_KEYS);
    }

    return metadata;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return {
      kind: "unknown",
      sizeBytes: byteSize(String(value))
    };
  }

  return {
    kind: "unknown"
  };
}
