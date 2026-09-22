# Project State

Last updated: 2026-09-21

## Current Phase

Phase 0 - Research and foundation.

## Active Backlog Item

Next: `VNT-103 - Current message-thread mapping`

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
- `VNT-103 - Current message-thread mapping` inspected local authorized HARs and found only unread-count endpoints, not a thread-list route. It is blocked pending a targeted messaging/inbox HAR capture.

## Current Priority

Next: unblock `VNT-103` with a read-only authorized HAR captured while opening and scrolling the messaging/inbox conversation list. Do not implement messaging adapters until a current thread-list route is observed.
