# Project State

Last updated: 2026-09-21

## Current Phase

Phase 0 - Research and foundation.

## Active Backlog Item

Next: `VNT-005 - Minimal private web UI: search`

## Progress

- Repository started from specifications and research notes.
- Minimal TypeScript workspace foundation created and verified.
- `VNT-001 - Bootstrap repository` is complete.
- `VNT-002 - Implement redacted HTTP diagnostics` is complete.
- `VNT-003 - Research/implement public session acquisition` is complete for FR public anonymous session acquisition.
- `VNT-004 - Implement current catalog search adapter` is complete for FR public search with text, price and pagination.
- `VNT-004A - Harden verified public client foundation` is complete: diagnostics sanitize error messages/final URLs, public session acquisition no longer hardcodes FR language, catalog inputs are validated, `item_box` is display-only metadata, and `nvm use` validates Node 24.21.0/npm 11.19.0 locally.

## Current Priority

Next: prepare `VNT-005` minimal private web UI search shell. Keep saved searches, polling and worker behavior out of scope until later backlog items.
