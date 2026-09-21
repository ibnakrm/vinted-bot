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
