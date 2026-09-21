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
Priority: P0  
Depends on: VNT-004A

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

Status: TODO  
Priority: P1

### VNT-102 - Own inventory mapping

Status: TODO  
Priority: P1

### VNT-103 - Current message-thread mapping

Status: TODO  
Priority: P1

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
