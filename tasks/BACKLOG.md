# Backlog

Statuses: TODO / IN_PROGRESS / BLOCKED / DONE

## EPIC 0 - Research & Foundation

### VNT-001 - Bootstrap repository

Status: DONE  
Priority: P0

Acceptance criteria:

- package manager chosen and locked;
- TypeScript strict config;
- lint/test/typecheck commands;
- `.env.example` without secrets;
- `.gitignore` protects secret/session artifacts;
- basic CI or documented local verification;
- architecture matches current decisions.

### VNT-002 - Implement redacted HTTP diagnostics

Status: DONE  
Priority: P0

Acceptance criteria:

- structured logger;
- known sensitive headers/fields redacted;
- tests prove no session cookie/token is emitted.

### VNT-003 - Research/implement public session acquisition

Status: DONE  
Priority: P0

Goal: reproduce only the minimum current session context required by public catalog calls.

Acceptance criteria:

- documented current market host behavior;
- cookies/anon ID/locale represented in typed session;
- no secret logging;
- sanitized fixture/evidence;
- capability map updated to `VERIFIED` if reproduced.

### VNT-004 - Implement current catalog search adapter

Status: DONE  
Priority: P0  
Depends on: VNT-003

Acceptance criteria:

- text search;
- price_from/price_to;
- pagination;
- brand/category/size/status if current contract supports them;
- normalization into internal item model;
- fixture tests;
- no third-party wrapper runtime dependency unless ADR explicitly changes.

### VNT-004A - Harden verified public client foundation

Status: DONE  
Priority: P0  
Depends on: VNT-004

Acceptance criteria:

- public session acquisition does not hardcode FR `Accept-Language`;
- generic session material helper is not treated as adapter-level capability readiness;
- diagnostics sanitize error messages and final URLs;
- `FetchVintedTransport` has unit tests with injected `fetchImpl`;
- catalog search input validation rejects negative and non-finite values;
- catalog item mapping treats `item_box` as display metadata only;
- `price.amount` is normalized to string;
- market URL parsing rejects deceptive `www.vinted.*` hostnames;
- Node 24 runtime validation is documented.

### VNT-005 - Minimal private web UI: search

Status: TODO  
Priority: P1  
Depends on: VNT-004A, VNT-101

Acceptance criteria:

- authenticated/private shell or temporary owner-only protection;
- search form;
- results list;
- errors visible but secrets hidden.

### VNT-006 - Persist saved searches

Status: TODO  
Priority: P1

### VNT-007 - Monitoring worker POC

Status: TODO  
Priority: P1

Goal: validate hosting model for periodic search and deduplication before committing to Netlify-only backend.

## EPIC 1 - Authenticated Reads

### VNT-101 - Authenticated session research

Status: DONE  
Priority: P0

Goal: research authenticated session behavior before UI work because it is the next critical product risk and blocks own inventory, messages, offers and listing management.

Result: authenticated-session context was verified from an authorized browser HAR using a sanitized, read-only account-specific proof request. Strong current-user identity endpoint remains a follow-up research question because no `/me/current/account` route was present in the HAR.

Acceptance criteria:

- identify how to recognize authenticated state from reproduced account-specific evidence, not cookie names alone;
- document observed cookie/header/session signal names without real values;
- compare public guest session material with authenticated session material;
- identify a safe read-only proof endpoint for the current account;
- create a sanitized fixture only after live authorized reproduction;
- update capability map without marking `IMPLEMENTED` unless typed code and tests are added.

### VNT-102 - Own inventory mapping

Status: DONE  
Priority: P1

Result: implemented read-only own-inventory adapter from verified authorized FR HAR evidence. Route: `GET /api/v2/wardrobe/{userId}/items?page=...&per_page=...&order=relevance`.

Acceptance criteria:

- route documented with sanitized user ID;
- adapter accepts explicit `userId`;
- host class is `site`;
- pagination maps `current_page`, `total_pages`, `total_entries`, `per_page`, `time`;
- item mapper exposes a minimal own-listing model;
- sanitized fixture exists;
- tests cover route, query, session headers, mapping, empty response, invalid response, HTTP failure and secret redaction.

### VNT-103 - Current message-thread mapping

Status: BLOCKED  
Priority: P1

Blocker: local authorized HAR inspection found only unread-count endpoints (`/messaging/main/users/unread_count` and `/inbox-notifications/v1/notifications/unread_count`), not a thread-list route. Capture a new authorized read-only HAR while opening and scrolling the messaging/inbox conversation list.

### VNT-104 - Message read adapter

Status: TODO  
Priority: P1

## EPIC 2 - Seller Writes

### VNT-201 - Listing create mapping

Status: TODO  
Priority: P1

### VNT-202 - Image upload mapping

Status: TODO  
Priority: P1

### VNT-203 - Listing update mapping

Status: TODO  
Priority: P1

### VNT-204 - Listing delete mapping

Status: TODO  
Priority: P1

## EPIC 3 - Messaging & Offers

### VNT-301 - Send message mapping

Status: TODO  
Priority: P1

### VNT-302 - Favorites/event mapping

Status: TODO  
Priority: P2

### VNT-303 - Send offer mapping

Status: TODO  
Priority: P2

### VNT-304 - Automation rule engine

Status: TODO  
Priority: P2

## EPIC 4 - Intelligence

### VNT-401 - Price history

Status: TODO  
Priority: P2

### VNT-402 - Seller monitoring

Status: TODO  
Priority: P2

### VNT-403 - Opportunity scoring

Status: TODO  
Priority: P3

## EPIC 5 - Purchase Assistance

### VNT-501 - Checkout research

Status: TODO  
Priority: P3

No autonomous purchase by default.
