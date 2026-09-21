# Vinted API Capability Map

Last updated: 2026-09-21

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
| Brand/category/size/status filters | FOUND | Supported by current scraper research hints; not reproduced. | P0 |
| Item public metadata | FOUND | Search data plus HTML/OpenGraph fallback reported by external research; not reproduced. | P0 |
| User profile | FOUND | Multiple historical wrappers/scrapers support it; current behavior unverified. | P1 |
| Seller inventory | FOUND | Multiple scraper products expose it historically/currently; current route unverified here. | P1 |
| Read own inventory | UNKNOWN | Needs current authenticated mapping. | P1 |
| Read message threads | FOUND | Historical code used `/api/v2/users/{user_id}/msg_threads`; not reproduced. | P1 |
| Read messages | FOUND | Historical scraper parsed `msg_thread.messages`; not reproduced. | P1 |
| Send message | UNKNOWN | Needs current authenticated write mapping. | P1 |
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
- required headers observed:
  - `Cookie`: requests without cookie returned `403` in VNT-004 spot checks
- optional headers sent by implementation:
  - `Accept: application/json, text/plain, */*`
  - `Accept-Language` from public session locale when available
  - `X-Anon-Id` when available; spot check with cookie but without `X-Anon-Id` returned `200`
- response shape:
  - root object with `items`, `pagination`, `search_tracking_params`
  - pagination fields observed: `current_page`, `per_page`, `total_entries`, `total_pages`
  - item fields mapped: `id`, `title`, `price.amount`, `price.currency_code`, `url`, `photo.full_size_url`, `item_box.first_line`, `item_box.second_line`, `user.id`
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

Status remains `FOUND` until reproduced against a current authorized account session.

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
- Session usability rule: usable when at least one public network identity signal is present, currently cookies or `X-Anon-Id`; locale alone is not considered usable.
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
- Required session components observed:
  - public session cookies are required; request without cookie returned `403`
  - `X-Anon-Id` was not required when cookies were present in spot checks
- Response fixture: `fixtures/vinted/catalog/search-polo-lacoste-fr.sanitised.json`
- Known failure behavior represented in tests: HTTP non-200, invalid payload, missing cookie-backed session.
