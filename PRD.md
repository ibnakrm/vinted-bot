# PRD - Vinted Automation Platform

Status: Draft V0.1  
Owner: Othemane  
Primary implementation agent: OpenAI Codex  
Last updated: 2026-09-19

## Product Vision

Build a private, full-code web platform for managing and automating selected Vinted workflows from one interface.

The product eventually covers two domains:

- Seller Operations: manage the owner's Vinted listings, messages, offers and selected follow-up automations.
- Marketplace Intelligence: search, filter, extract, monitor and analyze listings and sellers on Vinted.

The first audience is the owner, with optional invited users later.

## Product Goals

- Centralized private dashboard.
- Marketplace search and extraction by text, brand, category, price, size, condition, seller, ordering and pagination.
- Listing management after write endpoints are mapped and verified.
- Messaging and negotiation after authenticated read/write behavior is mapped and verified.
- Favorites/engagement automation only when technically and policy-safe.
- Saved-search monitoring with deduplication and change detection.
- Maintainability against Vinted changes through internal adapters.

## Non-Goals For V1

- Autonomous purchasing without human confirmation.
- Large-scale multi-account farming.
- Bypassing access-control mechanisms.
- CAPTCHA defeating or anti-bot evasion as a core feature.
- AI negotiation before deterministic messaging/offers work reliably.
- Advanced analytics before raw data acquisition is stable.

## Roles

- `OWNER`: full access to configuration, users, logs and all tools.
- `ADMIN`: future nearly full access.
- `USER`: invited user with assigned Vinted accounts and modules.

## Core Journeys

- Search and extract: define filters, query the Vinted adapter, normalize results and inspect/export/save.
- Saved search monitoring: periodically execute saved searches, deduplicate results and create events.
- Create listing: validate draft, upload media and create listing only after endpoints are verified.
- Message management: fetch threads/messages from an authenticated account and send replies only after mapping is verified.
- Delayed favorite follow-up: detect favorite-like events if available, wait configured delay, check conditions and propose or execute action depending on configuration.

## Functional Requirements

- Private platform authentication with no public sign-up in V1.
- Vinted credentials/session material must not be exposed to frontend JavaScript unless inherently required by the user's browser flow.
- Search must expose normalized input independent from Vinted endpoint shape.
- Internal item models must not depend on raw Vinted response names.
- Listing writes are research-gated.
- Message read and write capabilities are separate.
- Automation must model trigger, delay, conditions, action, execution state, idempotency key and audit log.
- High-impact actions such as purchase require explicit human confirmation by default.
- External requests need structured diagnostics with secret redaction.
- Unstable Vinted capabilities must be feature-flagged.

## Non-Functional Requirements

- TypeScript strict mode.
- Provider/adapter pattern.
- Contract tests around sanitized Vinted payload fixtures.
- Context and research notes stored in `context/`.
- Server-side authorization.
- Encrypted/delegated secret storage in later phases.
- Retries with bounded exponential backoff for transient failures.
- Idempotency for automation actions.

## First Usable Milestone

M1 is successful when private login works, a Vinted session/client abstraction exists, search works with core filters, results are displayed, saved searches are persisted, one background monitoring job detects new results, logs/tests exist and the API capability map has evidence for implemented calls.
