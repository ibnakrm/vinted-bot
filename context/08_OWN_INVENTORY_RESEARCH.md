# Own Inventory Research

Last updated: 2026-09-21  
Backlog item: `VNT-102 - Own inventory mapping`

## Status

Own-inventory endpoint verified from an authorized FR HAR and implemented in `packages/vinted-client/src/inventory/`.

Current status for `Read own inventory`: `IMPLEMENTED`.

## HAR Analysis - 2026-09-21

Source: authorized browser HAR from the user's own logged-in Vinted session. The raw HAR is outside the repository and must never be committed.

### Search Scope

Searched Vinted requests on:

- `www.vinted.fr`
- `api.vinted.fr`

Searched for route/path/query signals related to:

- own items
- my items
- user items
- wardrobe
- closet
- profile items
- inventory
- catalog
- `/api/v2/users/{user_id}/items`
- `/users/{user_id}/items`
- `/items`
- `/wardrobe`
- `/catalog`

### Verified Route

| Method | Host | Host class | Path | Status | Content type |
| --- | --- | --- | --- | ---: | --- |
| GET | `www.vinted.fr` | `site` | `/api/v2/wardrobe/[REDACTED_USER_ID]/items` | 200 | `application/json` |

Observed query parameters:

- `page=1`
- `page=2`
- `per_page=20`
- `order=relevance`

### Response Shape

| Method | Host | Path | Status | Content type | Query params | Response root keys | Pagination fields | Item fields |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| GET | `www.vinted.fr` | `/api/v2/wardrobe/[REDACTED_USER_ID]/items` | 200 | `application/json` | `page`, `per_page`, `order` | `code`, `items`, `pagination` | `current_page`, `per_page`, `time`, `total_entries`, `total_pages` | `brand`, `can_edit`, `can_push_up`, `currency`, `favourite_count`, `id`, `is_business_user`, `is_closed`, `is_draft`, `is_favourite`, `is_heavy_bulky`, `is_hidden`, `is_processing`, `is_reserved`, `item_alert_type`, `item_box`, `item_closing_action`, `path`, `photos`, `price`, `promoted`, `push_up`, `service_fee`, `size`, `stats_visible`, `status`, `title`, `total_item_price`, `transaction_permitted`, `url`, `user`, `user_id`, `view_count` |

Page counts observed:

- page 1: 20 items
- page 2: 3 items

## Reproduction Decision

No additional live reproduction was attempted outside the browser HAR because cookie/session values were not exposed and must not be logged or copied. The authorized HAR is accepted as current reproduction evidence for `VERIFIED`; the adapter, tests and sanitized fixture make the capability `IMPLEMENTED`.

Do not hardcode the real user ID. The adapter receives `userId` explicitly and percent-encodes it into the wardrobe path.

## Session Requirements

For the observed wardrobe route, the HAR exposed these request header names:

- `accept`
- `accept-language`
- `locale`
- `priority`
- `referer`
- `sec-ch-ua`
- `sec-ch-ua-mobile`
- `sec-ch-ua-platform`
- `sec-fetch-dest`
- `sec-fetch-mode`
- `sec-fetch-site`
- `user-agent`
- `x-anon-id`
- `x-csrf-token`

Not observable in this HAR:

- request `Cookie` header;
- individual request cookie names;
- response `Set-Cookie` names;
- `Authorization` header;
- required versus optional status for `x-csrf-token`, `x-anon-id` or browser headers.

Session requirement conclusions:

- observed: `x-anon-id`, `x-csrf-token`, `accept`, `accept-language`, `locale`, `referer`, `user-agent`;
- required: unknown;
- optional: unknown;
- cookies: not observable in HAR;
- `Authorization`: not observed.

## Implementation

Implemented files:

- `packages/vinted-client/src/inventory/VintedInventoryClient.ts`
- `packages/vinted-client/src/inventory/types.ts`
- `packages/vinted-client/src/inventory/mappers.ts`
- `packages/vinted-client/src/inventory/errors.ts`
- `packages/vinted-client/src/inventory/VintedInventoryClient.test.ts`

Adapter behavior:

- host class: `site`
- path: `/api/v2/wardrobe/{userId}/items`
- query params: `page`, `per_page`, `order=relevance`
- rejects unobserved `order` values;
- maps only minimal explicit fields needed for own listings;
- normalizes `price.amount` to string;
- maps pagination fields `current_page`, `total_pages`, `total_entries`, `per_page`, `time`.

Sanitized evidence fixture:

- `fixtures/vinted/inventory/own-inventory-fr.sanitised.json`

## Next Evidence Needed

Future improvements need live, controlled reproduction if we want to determine which observed headers are truly required versus optional.

Minimum evidence needed:

- behavior without `x-csrf-token`;
- behavior without `x-anon-id`;
- whether cookies are required, using a safe authorized setup where cookie names can be observed without storing values;
- behavior for empty real inventory pages;
- any alternative ordering values, only if observed.
