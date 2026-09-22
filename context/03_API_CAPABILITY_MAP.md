# Vinted API Capability Map

Last updated: 2026-09-22

Statuses:

- `UNKNOWN`
- `FOUND`
- `VERIFIED`
- `IMPLEMENTED`
- `BROKEN`

| Capability | Status | Current evidence / notes | Priority |
| --- | --- | --- | ---: |
| Acquire public session context | IMPLEMENTED | Verified live on 2026-09-21 against `https://www.vinted.fr/`: `GET /` returned 200, public cookies, `X-Anon-Id`, locale `fr-FR`; implemented in `packages/vinted-client` with sanitized fixture `fixtures/vinted/session/public-session-fr.sanitised.json` and unit tests. | P0 |
| Catalog search | IMPLEMENTED | Verified live on 2026-09-21 against `https://api.vinted.fr/svc-catalogue/items` using public FR session cookies; implemented in `VintedCatalogClient` with sanitized fixture `fixtures/vinted/catalog/search-polo-lacoste-fr.sanitised.json` and tests. | P0 |
| Text filter | IMPLEMENTED | Verified live as `search_text=polo Lacoste` on `/svc-catalogue/items`; `query` and `q` did not behave as text search during spot checks. | P0 |
| Price filters | IMPLEMENTED | Verified live as `price_from=10` and `price_to=15` on `/svc-catalogue/items`; implemented as `priceFrom` and `priceTo`. | P0 |
| Authenticated session recognition | VERIFIED | Verified from authorized browser HAR on 2026-09-21. Best read-only proof request present: `GET https://www.vinted.fr/api/v2/users/[REDACTED_USER_ID]/items/favourites` returned 200 with `code`, `items`, `pagination`; supporting account-specific unread-count endpoints also returned 200. Cookie values were not observable/stored; `x-anon-id` and `x-csrf-token` header names were observed. Sanitized fixture: `fixtures/vinted/session/authenticated-session-fr.sanitised.json`. | P0 |
| Current user / account proof endpoint | FOUND | No `/me`, `/current_user`, `/api/v2/users/current`, `/api/v2/users/me`, `/profile` or `/account` endpoint was present in the authorized HAR. A weaker account-specific proof endpoint was found via favourites path, but it does not provide strong current-user identity proof. | P0 |
| Brand/category/size/status filters | FOUND | Supported by current scraper research hints; not reproduced. | P0 |
| Item public metadata | FOUND | Search data plus HTML/OpenGraph fallback reported by external research; not reproduced. | P0 |
| User profile | FOUND | Multiple historical wrappers/scrapers support it; current behavior unverified. | P1 |
| Seller inventory | FOUND | Multiple scraper products expose it historically/currently; current route unverified here. | P1 |
| Read own inventory | IMPLEMENTED | Verified from authorized authenticated browser HAR on 2026-09-21. Route: `GET https://www.vinted.fr/api/v2/wardrobe/[REDACTED_USER_ID]/items?page=1&per_page=20&order=relevance` and page 2 returned 200 JSON with `items`, `pagination`, `code`; implemented in `VintedInventoryClient` with tests and sanitized fixture `fixtures/vinted/inventory/own-inventory-fr.sanitised.json`. | P1 |
| Read message threads | IMPLEMENTED | Verified from authorized authenticated browser HAR on 2026-09-22. Route: `GET https://api.vinted.fr/messaging/main/inbox`, with `next_cursor` pagination observed; implemented in `VintedMessagingClient` with privacy-first mapper, diagnostics response preview disabled and sanitized fixture `fixtures/vinted/messaging/message-threads-fr.sanitised.json`. | P1 |
| Read messages | IMPLEMENTED | Verified from authorized authenticated browser HAR on 2026-09-22. Route: `GET https://api.vinted.fr/messaging/main/conversations/[CONVERSATION_ID]`; implemented in `VintedMessagingClient.getConversation` with metadata mapping, plain text extraction from `message_type=text` plus `data.body`, diagnostics response preview disabled and sanitized fixture `fixtures/vinted/messaging/conversation-detail-fr.sanitised.json`. | P1 |
| Send message | IMPLEMENTED | Verified from authorized authenticated browser HAR on 2026-09-22. Route: `POST https://api.vinted.fr/messaging/main/conversations/[CONVERSATION_ID]/replies` returned `201`; implemented in `VintedMessagingClient.sendMessage` for plain text replies only, with exact minimal payload, request/response diagnostic previews disabled and sanitized fixture `fixtures/vinted/messaging/send-message-fr.sanitised.json`. | P1 |
| Create listing | UNKNOWN | Research target. | P1 |
| Upload listing photos | UNKNOWN | Research target. | P1 |
| Update listing | UNKNOWN | Research target. | P1 |
| Delete listing | UNKNOWN | Research target. | P1 |
| Favorite item | UNKNOWN | Needs mapping. | P2 |
| Read own favorites | FOUND | Historical wrappers mention account favorites; current behavior unverified. | P2 |
| Identify user who favorited own item | UNKNOWN | Important for delayed follow-up automation. | P2 |
| Send offer | UNKNOWN | Needs current write mapping. | P2 |
| Read offer | UNKNOWN | Needs mapping. | P2 |
| Accept/decline offer | UNKNOWN | Needs mapping. | P2 |
| Orders | FOUND | Historical wrappers and Pro API show order concepts; current non-Pro endpoints need verification. | P3 |
| Purchase | UNKNOWN | Deferred high-impact action. | P3 |

## Known Route Notes

### Search

Current research candidate:

- host class: `api.vinted.<market>`
- route: `/svc-catalogue/items`
- evidence source: external research hint recorded from `Giglium/vinted_scraper`

Current verified route:

- status: `IMPLEMENTED`
- verification date: 2026-09-21
- market/domain: FR, `https://api.vinted.fr`
- method: `GET`
- sanitized route: `/svc-catalogue/items`
- query parameters verified:
  - `search_text`
  - `price_from`
  - `price_to`
  - `page`
  - `per_page`
- required headers observed in FR spot checks:
  - `Cookie`: requests without cookie returned `403` in VNT-004 spot checks
- optional headers sent by implementation:
  - `Accept: application/json, text/plain, */*`
  - `Accept-Language` from public session locale when available
  - `X-Anon-Id` when available; spot check with cookie but without `X-Anon-Id` returned `200`
- response shape:
  - root object with `items`, `pagination`, `search_tracking_params`
  - pagination fields observed: `current_page`, `per_page`, `total_entries`, `total_pages`
  - item fields mapped: `id`, `title`, `price.amount` as string, `price.currency_code`, `url`, `photo.full_size_url`, explicit `brand_title`/`size_title` when present, `item_box.first_line`/`item_box.second_line` as display-only metadata, `user.id`
- response fixture: `fixtures/vinted/catalog/search-polo-lacoste-fr.sanitised.json`

Legacy route seen in older libraries:

- `/api/v2/catalog/items`

Do not assume the legacy route is current. It remains historical/legacy evidence only; it was not re-tested during VNT-004.

### Item Details

Historical route:

- `/api/v2/items/{id}/details`

Recent research hints report anti-bot 403 behavior and use HTML/OpenGraph fallback for limited fields.

### Message Threads

Historical route:

- `/api/v2/users/{user_id}/msg_threads`

Status: `IMPLEMENTED`

VNT-103 initially inspected local authorized HARs on 2026-09-22 and found only account-specific counters:

- `GET https://api.vinted.fr/messaging/main/users/unread_count` -> `200`, root key `unread_count`
- `GET https://api.vinted.fr/inbox-notifications/v1/notifications/unread_count` -> `200`, root key `count`

These counter routes do not return thread collections, participants, last-message metadata or pagination. They must not be treated as message-thread listing endpoints.

Current verified route from a later authorized messaging HAR:

- verification date: 2026-09-22
- market/domain: FR, `https://api.vinted.fr`
- host class: `api`
- method: `GET`
- sanitized route: `/messaging/main/inbox`
- first page query: none
- next page query: `next_cursor=[REDACTED_CURSOR]`
- observed response: `200 OK`, `application/json`
- response root keys: `conversations`, `pagination`
- conversation fields observed: `conversation_type`, `created_at`, `data`, `id`, `is_deletable`, `is_unread_by_current_user`, `labels`, `last_message`, `nudges`, `opposite_users`
- last-message fields observed: `conversation_id`, `created_at`, `data`, `id`, `message_type`, `sender_id`
- pagination fields observed: `has_next`, `has_prev`, `next_cursor`, `prev_cursor`
- observed request header names: `accept`, `accept-language`, `locale`, `origin`, `platform`, `referer`, `user-agent`, `x-anon-id`, `x-csrf-token`, `x-next-app`
- cookies: not observable in HAR; do not conclude they are absent or unnecessary
- `Authorization`: not observed
- response fixture: `fixtures/vinted/messaging/message-threads-fr.sanitised.json`

Implementation:

- adapter: `packages/vinted-client/src/messaging/VintedMessagingClient.ts`
- mapper/types/errors/tests under `packages/vinted-client/src/messaging/`
- privacy: mapper stores metadata only, never message content; request diagnostics set `includeResponseBodyPreview: false`
- cursor handling: `next_cursor` is opaque and must not be decoded or interpreted

Implemented by VNT-104:

- adapter: `packages/vinted-client/src/messaging/VintedMessagingClient.ts`
- method: `getConversation(conversationId)`
- route: `GET /messaging/main/conversations/[CONVERSATION_ID]` -> `200`
- privacy: message text is returned to code for valid text messages, but diagnostics response previews are disabled for this route

### Message Reads

Status: `IMPLEMENTED`

Current verified route from authorized messaging HAR evidence:

- verification date: 2026-09-22
- market/domain: FR, `https://api.vinted.fr`
- host class: `api`
- method: `GET`
- sanitized route: `/messaging/main/conversations/[CONVERSATION_ID]`
- observed response: `200 OK`, `application/json`
- query: none observed
- root fields observed: `allow_reply`, `conversation_type`, `created_at`, `data`, `id`, `is_deletable`, `is_peeking`, `is_seen`, `is_unread_by_current_user`, `localization`, `messages`, `opposite_users`, `pagination`, `peeking_as_side`
- message fields observed: `conversation_id`, `created_at`, `data`, `id`, `message_type`, `sender_id`
- pagination fields represented in fixture: `has_next`, `has_prev`, `next_cursor`, `prev_cursor`
- observed request header names: `accept`, `accept-language`, `locale`, `origin`, `platform`, `referer`, `user-agent`, `x-anon-id`, `x-csrf-token`, `x-next-app`
- cookies: not observable in HAR; do not conclude they are absent or unnecessary
- `Authorization`: not observed
- response fixture: `fixtures/vinted/messaging/conversation-detail-fr.sanitised.json`

Implementation:

- adapter: `packages/vinted-client/src/messaging/VintedMessagingClient.ts`
- mapper/types/errors/tests under `packages/vinted-client/src/messaging/`
- method: `getConversation(conversationId: string | number)`
- path encoding: conversation ID is encoded as a path segment
- text extraction: only maps `text` when `message_type === "text"` and `data.body` is a string
- non-text messages: system, offer and attachment-like messages are tolerated but not mapped to business fields in VNT-104
- diagnostics: request sets `includeResponseBodyPreview: false`, so private message content is not emitted even when global JSON preview is enabled

Important limitation:

- The raw HAR was not available in local paths during this implementation pass. The code and fixture stay conservative and do not infer additional message `data` schemas beyond the supplied route/field evidence and sanitized text fixture.

### Message Send

Status: `IMPLEMENTED`

Current verified route from authorized messaging HAR evidence:

- verification date: 2026-09-22
- market/domain: FR, `https://api.vinted.fr`
- host class: `api`
- method: `POST`
- sanitized route: `/messaging/main/conversations/[CONVERSATION_ID]/replies`
- observed response: `201 Created`
- request content type: `application/json`
- query: none observed
- request payload for simple text:
  - `content`
  - `is_personal_data_sharing_check_skipped=false`
  - `photo_temp_uuids=null`
- response fields observed: `conversation_id`, `created_at`, `data`, `id`, `message_type`, `sender_id`
- response `data` fields observed: `content`, `id`
- observed `message_type`: `reply_plain`
- observed request header names: `accept`, `accept-language`, `content-type`, `locale`, `origin`, `platform`, `referer`, `user-agent`, `x-anon-id`, `x-csrf-token`, `x-next-app`
- cookies: not established from this capture
- `Authorization`: not observed
- response fixture: `fixtures/vinted/messaging/send-message-fr.sanitised.json`

Implementation:

- adapter: `packages/vinted-client/src/messaging/VintedMessagingClient.ts`
- method: `sendMessage(input: SendMessageInput)`
- public input: `conversationId`, `content`
- validation: rejects empty conversation ID, empty content and whitespace-only content
- payload: sends only the observed `content`, `is_personal_data_sharing_check_skipped=false`, `photo_temp_uuids=null`
- privacy: disables both request and response body previews because private message text appears in both directions

Explicitly not implemented:

- photo message upload/sending
- create conversation
- send offer
- automatic replies or bulk messaging

### Authenticated Session Recognition

Status: `VERIFIED` for authenticated-session evidence; `FOUND` for current-user/account identity endpoint.

Authorized HAR analysis on 2026-09-21 found three useful read-only account-specific requests:

- `GET https://www.vinted.fr/api/v2/users/[REDACTED_USER_ID]/items/favourites` -> `200`, decoded JSON root keys `code`, `items`, `pagination`
- `GET https://api.vinted.fr/messaging/main/users/unread_count` -> `200`, JSON root key `unread_count`
- `GET https://api.vinted.fr/inbox-notifications/v1/notifications/unread_count` -> `200`, JSON root key `count`

Chosen proof endpoint: `/api/v2/users/[REDACTED_USER_ID]/items/favourites`, because it is read-only, account-scoped, returned 200 and has a richer response shape than unread-count endpoints.

Important constraints:

- This verifies authenticated-session context, not strong current-user identity proof.
- Do not infer authentication from cookie names alone. The public FR session fixture already recorded cookie names including `access_token_web` and `refresh_token_web`.
- The HAR did not expose the request `Cookie` header, individual cookie names, `Set-Cookie` names or `Authorization`.
- Header names observed on account-specific requests include `x-anon-id` and `x-csrf-token`; values are not stored.
- Sanitized fixture: `fixtures/vinted/session/authenticated-session-fr.sanitised.json`.

### Own Inventory

Status: `IMPLEMENTED`

VNT-102 verified own-inventory route from an authorized authenticated FR browser HAR:

- market/domain: FR, `https://www.vinted.fr`
- host class: `site`
- method: `GET`
- sanitized route: `/api/v2/wardrobe/[REDACTED_USER_ID]/items`
- query parameters observed:
  - `page=1`
  - `page=2`
  - `per_page=20`
  - `order=relevance`
- observed response: `200 OK`, `application/json`
- response root keys: `items`, `pagination`, `code`
- pagination fields observed: `current_page`, `total_pages`, `total_entries`, `per_page`, `time`
- page counts observed: page 1 contained 20 items; page 2 contained 3 items
- observed request header names include `x-anon-id`, `x-csrf-token`, `accept`, `accept-language`, `locale`, `referer`, `user-agent`
- cookies were not observable in the HAR; do not conclude they are absent or unnecessary
- `Authorization` was not observed

Implementation:

- adapter: `packages/vinted-client/src/inventory/VintedInventoryClient.ts`
- mapper/types/errors/tests under `packages/vinted-client/src/inventory/`
- sanitized fixture: `fixtures/vinted/inventory/own-inventory-fr.sanitised.json`
- test fixture: `packages/vinted-client/src/inventory/__fixtures__/own-inventory-response.sanitised.json`

## Evidence Rule

When changing a capability to `VERIFIED`, append verification date, market/domain, HTTP method, sanitized route, required auth/session components, request shape, response fixture location and known failure behavior.

## Verification Evidence

### Public Session Acquisition

- Status: `IMPLEMENTED`
- Verification date: 2026-09-21
- Market/domain: FR, `https://www.vinted.fr`
- HTTP method: `GET`
- Sanitized route: `/`
- Host class: `site`
- Required auth/session components: none; anonymous public request
- Observed response: `200 OK`, `text/html; charset=utf-8`, no redirect
- Observed public session material:
  - `Set-Cookie`: present, values redacted in fixture
  - `X-Anon-Id`: present, value redacted in fixture
  - locale: `fr-FR`
  - CSRF token: not observed in this reproduction
- Session material rule: public acquisition requires at least one public network identity signal, currently cookies, `X-Anon-Id` or CSRF token; locale alone is not considered session material. Adapter-specific requirements are stricter where verified.
- Response fixture: `fixtures/vinted/session/public-session-fr.sanitised.json`
  - Known failure behavior represented in tests: network error, unexpected status, missing usable session information and invalid market URL.

### Catalog Search

- Status: `IMPLEMENTED`
- Verification date: 2026-09-21
- Market/domain: FR, `https://api.vinted.fr`
- HTTP method: `GET`
- Sanitized route: `/svc-catalogue/items`
- Request shape:
  - `search_text=polo Lacoste`
  - `price_from=10`
  - `price_to=15`
  - `page=1`
  - `per_page=10`
- Observed response: `200 OK`, `application/json`
- Observed pagination:
  - `current_page=1`
  - `per_page=10`
  - `total_entries=960`
  - `total_pages=96`
- Required session components observed in FR catalog spot checks on 2026-09-21:
  - public session cookies were required; request without cookie returned `403`
  - `X-Anon-Id` was not required when cookies were present in spot checks
- Response fixture: `fixtures/vinted/catalog/search-polo-lacoste-fr.sanitised.json`
- Known failure behavior represented in tests: HTTP non-200, invalid payload, missing cookie-backed session.
