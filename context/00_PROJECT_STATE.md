# Project State

Last updated: 2026-09-21

## Current Phase

Phase 0 - Research and foundation.

## Active Backlog Item

Next: `VNT-101 - Authenticated session research`

## Progress

- Repository started from specifications and research notes.
- Minimal TypeScript workspace foundation created and verified.
- `VNT-001 - Bootstrap repository` is complete.
- `VNT-002 - Implement redacted HTTP diagnostics` is complete.
- `VNT-003 - Research/implement public session acquisition` is complete for FR public anonymous session acquisition.
- `VNT-004 - Implement current catalog search adapter` is complete for FR public search with text, price and pagination.
- `VNT-004A - Harden verified public client foundation` is complete: diagnostics sanitize error messages/final URLs, public session acquisition no longer hardcodes FR language, catalog inputs are validated, `item_box` is display-only metadata, and `nvm use` validates Node 24.21.0/npm 11.19.0 locally.

## Current Priority

Next: execute `VNT-101 - Authenticated session research` before UI work. Public research is already verified, and authenticated session behavior is now the critical product risk because it blocks own inventory, messages, offers and listing management. `VNT-005 - Minimal private web UI: search` is deferred to P1 and depends on VNT-101.
