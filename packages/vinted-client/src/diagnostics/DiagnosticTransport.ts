import { createBodyMetadata } from "./bodyMetadata.js";
import { redactDiagnosticText, redactDiagnosticUrl, redactHeaders, redactObject } from "./redact.js";
import type {
  DiagnosticSink,
  DiagnosticTransportOptions,
  HttpExchangeDiagnostic,
  HttpRequestDiagnostic,
  HttpResponseDiagnostic
} from "./types.js";
import type { VintedRequest, VintedResponse, VintedTransport } from "../transport/types.js";

let requestSequence = 0;

function nextCorrelationId(): string {
  requestSequence += 1;
  return `vinted-http-${Date.now()}-${requestSequence}`;
}

function findHeader(headers: Readonly<Record<string, string>>, headerName: string): string | undefined {
  const wanted = headerName.toLowerCase();
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted);
  return found?.[1];
}

function parseContentLength(headers: Readonly<Record<string, string>>): number | undefined {
  const value = findHeader(headers, "content-length");
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactDiagnosticText(error.message)
    };
  }

  return {
    name: "UnknownError",
    message: redactDiagnosticText(String(error))
  };
}

async function emit(sinks: readonly DiagnosticSink[], entry: HttpExchangeDiagnostic): Promise<void> {
  for (const sink of sinks) {
    await Promise.resolve(sink.write(entry));
  }
}

export class DiagnosticTransport implements VintedTransport {
  private readonly sinks: readonly DiagnosticSink[];
  private readonly options: DiagnosticTransportOptions;

  public constructor(
    private readonly inner: VintedTransport,
    sinks: DiagnosticSink | readonly DiagnosticSink[],
    options: DiagnosticTransportOptions = {}
  ) {
    this.sinks = Array.isArray(sinks) ? sinks : [sinks];
    this.options = options;
  }

  public async request<T>(request: VintedRequest): Promise<VintedResponse<T>> {
    const correlationId = request.requestId ?? nextCorrelationId();
    const startedAt = Date.now();
    const requestDiagnostic = this.createRequestDiagnostic(request, correlationId);

    try {
      const response = await this.inner.request<T>({
        ...request,
        requestId: correlationId
      });
      const responseDiagnostic = this.createResponseDiagnostic(response, correlationId, Date.now() - startedAt);

      await emit(this.sinks, {
        kind: "http",
        request: requestDiagnostic,
        response: responseDiagnostic
      });

      return response;
    } catch (error) {
      await emit(this.sinks, {
        kind: "http",
        request: requestDiagnostic,
        error: normalizeError(error)
      });
      throw error;
    }
  }

  private createRequestDiagnostic(request: VintedRequest, correlationId: string): HttpRequestDiagnostic {
    const diagnostic: HttpRequestDiagnostic = {
      timestamp: new Date().toISOString(),
      method: request.method,
      host: request.host,
      path: request.path,
      query: redactObject(request.query ?? {}) as Readonly<Record<string, unknown>>,
      headers: redactHeaders(request.headers ?? {}),
      body: createBodyMetadata(request.body),
      correlationId
    };

    if (request.hostname !== undefined) {
      diagnostic.hostname = request.hostname;
    }

    return diagnostic;
  }

  private createResponseDiagnostic<T>(
    response: VintedResponse<T>,
    correlationId: string,
    durationMs: number
  ): HttpResponseDiagnostic {
    const diagnostic: HttpResponseDiagnostic = {
      status: response.status,
      headers: redactHeaders(response.headers),
      body: createBodyMetadata(response.data, this.options),
      durationMs,
      correlationId
    };

    const contentLength = parseContentLength(response.headers);
    if (contentLength !== undefined) {
      diagnostic.bodySizeBytes = contentLength;
    }

    if (response.statusText !== undefined) {
      diagnostic.statusText = response.statusText;
    }

    if (response.finalUrl !== undefined) {
      diagnostic.finalUrl = redactDiagnosticUrl(response.finalUrl);
    }

    if (response.redirected !== undefined) {
      diagnostic.redirected = response.redirected;
    }

    const contentType = findHeader(response.headers, "content-type");
    if (contentType !== undefined) {
      diagnostic.contentType = contentType;
    }

    if (diagnostic.bodySizeBytes === undefined && diagnostic.body.sizeBytes !== undefined) {
      diagnostic.bodySizeBytes = diagnostic.body.sizeBytes;
    }

    return diagnostic;
  }
}
