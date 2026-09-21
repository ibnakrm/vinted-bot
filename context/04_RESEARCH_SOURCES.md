# Research Sources

Last updated: 2026-09-21

## Local Repositories Previously Analyzed

- `vinted-api-wrapper-master`: Python wrapper using legacy `/api/v2` style endpoints and anonymous cookies. Useful as historical reference, not adopted as product dependency.
- `vinted-api-main`: Express/MongoDB clone backend. It does not interact with Vinted and is not useful for Vinted API behavior.

### Consolidated Notes From Former `contexte/`

The previous `contexte/` folder contained an exploratory analysis of the two local repositories. It has been consolidated here so `context/` remains the only persistent project memory.

#### `vinted-api-wrapper-master`

- Repository: `https://github.com/Pawikoski/vinted-api-wrapper`
- Python package version observed locally: `0.3.9`
- Main dependency pattern: `cloudscraper`, `dacite`, `beautifulsoup4`.
- Relevant historical behavior:
  - initializes `https://www.vinted.<domain>`;
  - builds `https://www.vinted.<domain>/api/v2`;
  - fetches anonymous cookies from the homepage;
  - uses browser-like headers such as `User-Agent`, `Accept-Language`, `X-Requested-With` and `Sec-Fetch-*`;
  - supports optional proxy configuration;
  - raises on HTTP `429`.
- Legacy endpoints observed in code:
  - `/api/v2/catalog/items`
  - `/api/v2/catalog/filters`
  - `/api/v2/catalog/initializers`
  - `/api/v2/items/{id}/details`
  - `/api/v2/users`
  - `/api/v2/users/{id}`
  - `/api/v2/users/{id}/items`
  - `/api/v2/user_feedbacks`
  - `/api/v2/user_feedbacks/summary`
  - `/api/v2/search_suggestions`
- Known caveats from code reading:
  - read-only in practice;
  - no Vinted login, messages, purchase, favorites or listing publication;
  - refresh-cookie retry appears incomplete because `fetch_cookies()` is called without assigning `self.cookies`;
  - HTML description fallback uses a fragile `div[itemprop="description"]` selector;
  - no tests detected.

#### `vinted-api-main`

- Repository associated in local analysis: `https://github.com/remax21/vinted-api`
- It is a Node/Express/MongoDB/Cloudinary/Stripe marketplace clone backend.
- It does not interact with Vinted and should not be used as evidence for Vinted network behavior.
- Useful only as a negative reference: do not confuse a Vinted-like clone API with unofficial Vinted API behavior.

#### Open Research Items From Former Analysis

- Verify current behavior of any historical `/api/v2` endpoint before use.
- Verify market/domain differences such as `fr`, `com`, `co.uk`, etc.
- Verify whether public item metadata should come from current JSON endpoints, HTML/OpenGraph fallback or both.
- Treat Vinted anti-bot/rate-limit behavior as an external instability requiring current reproduction.

## External Hypotheses Recorded By Project Brief

- `Giglium/vinted_scraper` reportedly uses `/svc-catalogue/items` on an `api.` Vinted host for recent public catalog search.
- Legacy `/api/v2/catalog/items` should not be assumed current.
- Historical message-thread code used `/api/v2/users/{user_id}/msg_threads`.
- Current write endpoints are unknown.

## Live Research Performed In This Repository

### 2026-09-21 - FR Public Catalog Search

- Market: FR
- Public session source: `https://www.vinted.fr/`
- Endpoint verified: `GET https://api.vinted.fr/svc-catalogue/items`
- Query tested: `search_text=polo Lacoste`, `price_from=10`, `price_to=15`, `page=1`, `per_page=10`
- Result: `200 OK`, JSON response with `items`, `pagination`, `search_tracking_params`
- Header observations:
  - `Cookie` required in spot checks; without cookie returned `403`
  - `X-Anon-Id` not required when cookie was present in spot checks
  - `Accept-Language` not required in spot checks, but implementation sends session locale when available
  - explicit `User-Agent` was not required in the Node fetch reproduction
- Parameter observations:
  - `search_text` is the confirmed text-search parameter
  - `query` and `q` returned `200` but did not behave as the text-search parameter in spot checks
- Future filter IDs:
  - `brand_id`, `catalog_id`, `size_id`, `status_id`, and `color_id` were not present in the sanitized sample mapped by VNT-004
- Sanitized fixture: `fixtures/vinted/catalog/search-polo-lacoste-fr.sanitised.json`

## Fixture Policy

Store only sanitized research fixtures under `fixtures/vinted/`. Do not commit raw HAR exports, cookies, private messages, real session data or personal user data.
