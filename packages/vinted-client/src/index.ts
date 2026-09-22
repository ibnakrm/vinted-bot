export type { RedactedValue } from "./diagnostics/redact.js";
export { VintedCatalogClient } from "./catalog/VintedCatalogClient.js";
export {
  CatalogSearchHttpError,
  InvalidCatalogSearchInputError,
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
export { VintedInventoryClient } from "./inventory/VintedInventoryClient.js";
export {
  InvalidOwnInventoryInputError,
  InvalidOwnInventoryResponseError,
  OwnInventoryHttpError,
  OwnInventorySessionError
} from "./inventory/errors.js";
export {
  buildOwnInventoryQuery,
  mapOwnInventoryItem,
  mapOwnInventoryResponse
} from "./inventory/mappers.js";
export type {
  OwnInventoryInput,
  OwnInventoryItem,
  OwnInventoryItemPrice,
  OwnInventoryOrder,
  OwnInventoryPagination,
  OwnInventoryResult
} from "./inventory/types.js";
export { VintedMessagingClient } from "./messaging/VintedMessagingClient.js";
export {
  ConversationHttpError,
  InvalidConversationInputError,
  InvalidConversationResponseError,
  InvalidMessageThreadsInputError,
  InvalidMessageThreadsResponseError,
  MessageThreadsHttpError,
  MessageThreadsSessionError
} from "./messaging/errors.js";
export {
  buildConversationPath,
  buildMessageThreadsQuery,
  mapConversationMessage,
  mapConversationResponse,
  mapMessageThread,
  mapMessageThreadsResponse
} from "./messaging/mappers.js";
export type {
  ListMessageThreadsInput,
  ListMessageThreadsResult,
  MessagePagination,
  MessageThreadPagination,
  VintedConversation,
  VintedMessage,
  VintedMessageThread,
  VintedMessageThreadLastMessage,
  VintedMessageThreadOppositeUser
} from "./messaging/types.js";
export {
  isSensitiveDiagnosticKey,
  redactDiagnosticText,
  redactDiagnosticUrl,
  redactDiagnosticValue,
  redactHeaders,
  redactObject
} from "./diagnostics/redact.js";
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
  hasSessionMaterial,
  isSessionEmpty,
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
  VintedRequestDiagnostics,
  VintedResponse,
  VintedTransport
} from "./transport/types.js";
export { CapabilityUnavailableError, VintedTransportError } from "./transport/errors.js";
