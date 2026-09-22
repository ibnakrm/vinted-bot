# Project State

Last updated: 2026-09-22

## Current Phase

Phase 0 - Research and foundation.

## Active Backlog Item

Next: `VNT-301 - Send message mapping`

## Progress

- Repository started from specifications and research notes.
- Minimal TypeScript workspace foundation created and verified.
- `VNT-001 - Bootstrap repository` is complete.
- `VNT-002 - Implement redacted HTTP diagnostics` is complete.
- `VNT-003 - Research/implement public session acquisition` is complete for FR public anonymous session acquisition.
- `VNT-004 - Implement current catalog search adapter` is complete for FR public search with text, price and pagination.
- `VNT-004A - Harden verified public client foundation` is complete: diagnostics sanitize error messages/final URLs, public session acquisition no longer hardcodes FR language, catalog inputs are validated, `item_box` is display-only metadata, and `nvm use` validates Node 24.21.0/npm 11.19.0 locally.
- `VNT-101 - Authenticated session research` is complete for authenticated-session recognition from an authorized FR browser HAR. Sanitized evidence is stored in `fixtures/vinted/session/authenticated-session-fr.sanitised.json`; no raw HAR is committed. A strong current-user identity endpoint remains unverified because no `/me/current/account` route was present in the HAR.
- `VNT-102 - Own inventory mapping` is complete from a verified authorized FR HAR route: `GET /api/v2/wardrobe/[REDACTED_USER_ID]/items`. `VintedInventoryClient` implements read-only own inventory with sanitized fixture and tests.
- `VNT-103 - Current message-thread mapping` is complete from a verified authorized FR HAR route: `GET /messaging/main/inbox` on `api.vinted.fr`, with cursor pagination via `next_cursor`. `VintedMessagingClient` implements read-only thread listing with privacy-first mapping, diagnostics body preview disabled for messaging responses, sanitized fixture and tests.
- `VNT-104 - Message read adapter` is complete from a verified authorized FR HAR route: `GET /messaging/main/conversations/[CONVERSATION_ID]` on `api.vinted.fr`. `VintedMessagingClient.getConversation` implements read-only conversation detail with plain text extraction for `message_type=text` plus `data.body`, diagnostics body preview disabled, sanitized fixture and tests.

## Current Priority

Next: `VNT-301 - Send message mapping`, only as a research task with fresh authorized evidence. Do not implement messaging writes until the write endpoint, payload, auth/session behavior and safety constraints are verified.
