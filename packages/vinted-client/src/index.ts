export type { RedactedValue } from "./diagnostics/redact.js";
export { VintedCatalogClient } from "./catalog/VintedCatalogClient.js";
export {
  CatalogSearchHttpError,
  CatalogSearchSessionError,
  InvalidCatalogSearchResponseError
} from "./catalog/errors.js";
export {
  buildCatalogSearchQuery,
  mapCatalogSearchItem,
  mapCatalogSearchResponse
} from "./catalog/mappers.js";
export type {
  SearchItemsInput,
  SearchItemsPagination,
  SearchItemsResult,
  VintedSearchItem,
  VintedSearchItemPrice,
  VintedSessionProvider,
  VintedSessionSource
} from "./catalog/types.js";
export { redactDiagnosticValue, redactHeaders, redactObject } from "./diagnostics/redact.js";
export { DiagnosticTransport } from "./diagnostics/DiagnosticTransport.js";
export { ConsoleDiagnosticSink, MemoryDiagnosticSink } from "./diagnostics/sinks.js";
export type {
  DiagnosticBodyMetadata,
  DiagnosticSink,
  DiagnosticTransportOptions,
  HttpExchangeDiagnostic,
  HttpRequestDiagnostic,
  HttpResponseDiagnostic
} from "./diagnostics/types.js";
export {
  acquirePublicSession,
  createSessionFromPublicResponse,
  extractCsrfToken,
  extractHtmlLocale,
  isSessionEmpty,
  isSessionUsable,
  parseSetCookieHeaders,
  parseVintedMarketUrl
} from "./session/publicSession.js";
export {
  InvalidMarketUrlError,
  MissingUsableSessionInformationError,
  PublicSessionNetworkError,
  UnexpectedSessionStatusError
} from "./session/errors.js";
export type { VintedSession } from "./session/VintedSession.js";
export { FetchVintedTransport } from "./transport/FetchVintedTransport.js";
export type { FetchVintedTransportConfig } from "./transport/FetchVintedTransport.js";
export type {
  VintedHostClass,
  VintedRequest,
  VintedResponse,
  VintedTransport
} from "./transport/types.js";
export { CapabilityUnavailableError, VintedTransportError } from "./transport/errors.js";
