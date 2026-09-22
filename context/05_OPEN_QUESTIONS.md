# Open Questions

Last updated: 2026-09-21

- Which market/domain should be used first for reproducible research: `fr`, `com`, or another?
- What is the safest current source for item details if `/api/v2/items/{id}/details` returns 403?
- Which runtime should host persistent saved-search polling if Netlify functions are unsuitable?
- What secure secret-storage approach will be used for authenticated Vinted sessions in later phases?
- How will live integration tests be gated so they never run accidentally in CI?
- Do all Vinted markets expose the same public-session cookie and `X-Anon-Id` behavior as `www.vinted.fr`?
- Which of the public cookies observed on FR are strictly required by current `/svc-catalogue/items` requests?
- Do non-FR markets use the same `/svc-catalogue/items` query parameter names and pagination shape?
- Which current endpoints expose resolver data for `brand_id`, `catalog_id`, `size_id`, `status_id`, and `color_id`?
- Which Vinted market domains should be added to the strict allowlist after current reproduction, and are any listed domains unavailable from the target runtime?
- When `brand_title` or `size_title` is absent from search responses, should UI display `item_box` values only as presentation text or trigger an item-detail enrichment step?
- Which current read-only endpoint gives strong current-user identity proof? The 2026-09-21 authorized HAR did not include `/me`, `/current_user`, `/api/v2/users/current`, `/api/v2/users/me`, `/profile` or `/account`.
- Which authenticated session signals are actually required to reproduce the chosen favourites proof endpoint outside the browser? The HAR exposed `x-anon-id` and `x-csrf-token` header names but did not expose request cookies.
- Do `access_token_web` and `refresh_token_web` behave differently between guest and authenticated sessions? Their names were observed in a public FR fixture, while cookie names were not observable in the authenticated HAR.
- What is the safe expiry/refresh model for authenticated Vinted session material, and can it be observed without implementing login automation?
- Which own-inventory headers are truly required versus merely observed? VNT-102 observed `x-anon-id`, `x-csrf-token`, `accept`, `accept-language`, `locale`, `referer`, and `user-agent`, but did not perform comparative header removal.
- Are cookies required for `/api/v2/wardrobe/{userId}/items`? The authorized HAR did not expose request cookies, so cookie requirements remain unknown.
- Are any `order` values besides `relevance` supported for own inventory? VNT-102 only observed `order=relevance`.
