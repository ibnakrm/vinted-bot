import { DiagnosticTransport } from "../diagnostics/DiagnosticTransport.js";
import { MemoryDiagnosticSink } from "../diagnostics/sinks.js";
import type { DiagnosticSink, HttpExchangeDiagnostic } from "../diagnostics/types.js";
import { FetchVintedTransport } from "../transport/FetchVintedTransport.js";
import type { VintedResponse, VintedTransport } from "../transport/types.js";
import {
  InvalidMarketUrlError,
  MissingUsableSessionInformationError,
  PublicSessionNetworkError,
  UnexpectedSessionStatusError
} from "./errors.js";
import type { VintedSession } from "./VintedSession.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const KNOWN_VINTED_MARKETS: Readonly<Record<string, string>> = {
  "www.vinted.at": "AT",
  "www.vinted.be": "BE",
  "www.vinted.co.uk": "GB",
  "www.vinted.cz": "CZ",
  "www.vinted.de": "DE",
  "www.vinted.dk": "DK",
  "www.vinted.es": "ES",
  "www.vinted.fi": "FI",
  "www.vinted.fr": "FR",
  "www.vinted.hu": "HU",
  "www.vinted.it": "IT",
  "www.vinted.lt": "LT",
  "www.vinted.lu": "LU",
  "www.vinted.nl": "NL",
  "www.vinted.pl": "PL",
  "www.vinted.pt": "PT",
  "www.vinted.ro": "RO",
  "www.vinted.se": "SE",
  "www.vinted.sk": "SK"
};

export interface VintedMarket {
  siteBaseUrl: string;
  apiBaseUrl: string;
  hostname: string;
  market: string;
}

export interface PublicSessionAcquisitionOptions {
  marketUrl: string;
  acceptLanguage?: string;
  transport?: VintedTransport;
  diagnosticSink?: DiagnosticSink;
  timeoutMs?: number;
  now?: () => Date;
}

export interface PublicSessionAcquisitionResult {
  market: VintedMarket;
  session: VintedSession;
  status: number;
  statusText?: string;
  contentType?: string;
  finalUrl?: string;
  redirected: boolean;
  diagnostics: readonly HttpExchangeDiagnostic[];
}

export function isSessionEmpty(session: VintedSession): boolean {
  return (
    Object.keys(session.cookies).length === 0 &&
    session.anonId === undefined &&
    session.csrfToken === undefined &&
    session.locale === undefined
  );
}

export function hasSessionMaterial(session: VintedSession): boolean {
  return Object.keys(session.cookies).length > 0 || session.anonId !== undefined || session.csrfToken !== undefined;
}

export function parseVintedMarketUrl(value: string): VintedMarket {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InvalidMarketUrlError(value);
  }

  const hostname = url.hostname.toLowerCase();
  const market = KNOWN_VINTED_MARKETS[hostname];
  if (url.protocol !== "https:" || market === undefined) {
    throw new InvalidMarketUrlError(value);
  }

  const apiHostname = hostname.replace(/^www\./, "api.");

  return {
    siteBaseUrl: `https://${hostname}`,
    apiBaseUrl: `https://${apiHostname}`,
    hostname,
    market
  };
}

export function parseSetCookieHeaders(setCookieHeaders: readonly string[]): Record<string, string> {
  const cookies: Record<string, string> = {};

  for (const header of setCookieHeaders) {
    const [pair] = header.split(";");
    if (pair === undefined) {
      continue;
    }

    const separatorIndex = pair.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (name.length > 0) {
      cookies[name] = value;
    }
  }

  return cookies;
}

export function extractHtmlLocale(html: string): string | undefined {
  return /<html\b[^>]*\blang=["']([^"']+)["']/i.exec(html)?.[1];
}

export function extractCsrfToken(html: string): string | undefined {
  const metaPatterns = [
    /<meta\b[^>]*\bname=["']csrf-token["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bname=["']csrf-token["'][^>]*>/i
  ];

  for (const pattern of metaPatterns) {
    const token = pattern.exec(html)?.[1];
    if (token !== undefined) {
      return token;
    }
  }

  return undefined;
}

export function createSessionFromPublicResponse(
  response: VintedResponse<string>,
  acquiredAt: Date
): VintedSession {
  const anonId = response.headers["x-anon-id"] ?? response.headers["X-Anon-Id"];
  const session: VintedSession = {
    cookies: parseSetCookieHeaders(response.setCookie ?? []),
    acquiredAt: acquiredAt.toISOString()
  };

  if (anonId !== undefined && anonId.length > 0) {
    session.anonId = anonId;
  }

  const locale = extractHtmlLocale(response.data);
  if (locale !== undefined && locale.length > 0) {
    session.locale = locale;
  }

  const csrfToken = extractCsrfToken(response.data);
  if (csrfToken !== undefined && csrfToken.length > 0) {
    session.csrfToken = csrfToken;
  }

  return session;
}

function contentTypeOf(response: VintedResponse<string>): string | undefined {
  return response.headers["content-type"] ?? response.headers["Content-Type"];
}

export async function acquirePublicSession(
  options: PublicSessionAcquisitionOptions
): Promise<PublicSessionAcquisitionResult> {
  const market = parseVintedMarketUrl(options.marketUrl);
  const memorySink = new MemoryDiagnosticSink();
  const sinks = options.diagnosticSink === undefined ? [memorySink] : [memorySink, options.diagnosticSink];
  const baseTransport =
    options.transport ??
    new FetchVintedTransport({
      siteBaseUrl: market.siteBaseUrl,
      apiBaseUrl: market.apiBaseUrl
    });
  const transport = new DiagnosticTransport(baseTransport, sinks);

  let response: VintedResponse<string>;
  const headers: Record<string, string> = {
    accept: "text/html,application/xhtml+xml"
  };

  if (options.acceptLanguage !== undefined && options.acceptLanguage.length > 0) {
    headers["accept-language"] = options.acceptLanguage;
  }

  try {
    response = await transport.request<string>({
      method: "GET",
      host: "site",
      hostname: market.hostname,
      path: "/",
      headers,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new PublicSessionNetworkError(error.message);
    }
    throw new PublicSessionNetworkError(String(error));
  }

  if (response.status < 200 || response.status >= 400) {
    throw new UnexpectedSessionStatusError(response.status, response.statusText);
  }

  const session = createSessionFromPublicResponse(response, options.now?.() ?? new Date());
  if (!hasSessionMaterial(session)) {
    throw new MissingUsableSessionInformationError();
  }

  const result: PublicSessionAcquisitionResult = {
    market,
    session,
    status: response.status,
    redirected: response.redirected ?? false,
    diagnostics: memorySink.entries
  };

  if (response.statusText !== undefined) {
    result.statusText = response.statusText;
  }

  const contentType = contentTypeOf(response);
  if (contentType !== undefined) {
    result.contentType = contentType;
  }

  if (response.finalUrl !== undefined) {
    result.finalUrl = response.finalUrl;
  }

  return result;
}
