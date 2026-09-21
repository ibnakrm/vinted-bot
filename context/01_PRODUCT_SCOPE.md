# Product Scope

Last updated: 2026-09-21

## In Scope

- Private owner-first Vinted automation platform.
- Public marketplace intelligence: search, extraction, saved searches, monitoring and normalized item data.
- Seller operations after current authenticated endpoints are mapped and verified.
- Vinted-specific network behavior isolated in `packages/vinted-client`.
- Evidence-driven API capability lifecycle stored in `context/03_API_CAPABILITY_MAP.md`.
- Sanitized fixtures for parser/transport/session behavior.

## Out Of Scope For Current Phase

- User login to Vinted.
- Message sending.
- Favorites, offers and listing writes.
- Uploading or deleting listings.
- Checkout and autonomous purchasing.
- CAPTCHA solving, access-control bypasses or Vinted Pro allowlist bypasses.

## Current Phase Scope

Phase 0 focuses on repository foundations, safe diagnostics, public anonymous session acquisition and public catalog research.

No Vinted write/private endpoint may be treated as implemented until it has current reproduction, sanitized evidence, typed code and tests.
