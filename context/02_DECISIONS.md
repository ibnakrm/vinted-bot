# Decisions

## ADR-0001 - Use npm workspaces for initial bootstrap

Date: 2026-09-21  
Status: Accepted

The technical proposal originally listed pnpm workspaces. The current execution environment does not have `pnpm` installed, while `npm` is available and supports workspaces with a lockfile.

Decision: use npm workspaces for Phase 0 so the repository can be bootstrapped and verified immediately. This can be revisited with an explicit migration ADR if the team wants pnpm later.

## ADR-0002 - Keep Vinted network logic isolated

Date: 2026-09-21  
Status: Accepted

All Vinted-specific session, diagnostics, transport and future endpoint adapters live in `packages/vinted-client`. Domain package code must not import raw Vinted DTOs or endpoint-specific shapes.

## ADR-0003 - Defer UI and worker scaffolding

Date: 2026-09-21  
Status: Accepted

Netlify remains the preferred UI/control-plane target, but persistent polling and worker workloads are separate concerns. Phase 0 creates package boundaries first and defers `apps/` and `workers/` until search/session behavior is verified.

## ADR-0004 - Normalize runtime on Node 24 LTS

Date: 2026-09-21  
Status: Accepted

The project now targets Node 24 LTS via `.nvmrc` and `package.json` `engines.node`.

Rationale: Vinted Bot should have one stable runtime baseline for strict TypeScript, diagnostics, future transport behavior and CI. Local execution is validated with `nvm use` from `.nvmrc`, which selects Node 24.21.0 and npm 11.19.0 in this workspace.

## ADR-0005 - Instrument transports through diagnostic sinks

Date: 2026-09-21  
Status: Accepted

HTTP diagnostics are implemented as a wrapper around `VintedTransport`, not inside future endpoint adapters. `DiagnosticTransport` emits a redacted structured exchange to a `DiagnosticSink`; current sinks include memory and console implementations. This keeps future sinks such as JSONL files, database persistence or remote observability independent from catalog/search/message implementations.

## Known dev dependency advisories

Date: 2026-09-21  
Status: Monitoring

`npm audit` reports advisories in the Vitest/Vite/esbuild development-tooling chain, including items with no direct fix available from the current dependency graph. No mass upgrade or forced audit fix was applied during `VNT-002` because that would be unrelated dependency churn. Revisit when upgrading the test stack or when a fixed Vitest/Vite release is available.

## ADR-0006 - Public anonymous session material

Date: 2026-09-21  
Status: Accepted

A public Vinted session is considered empty when it has no cookies, no `X-Anon-Id`, no CSRF token and no locale. It is considered to contain public session material when at least one network identity signal is present: parsed `Set-Cookie` values, `X-Anon-Id` or CSRF token.

Locale alone is useful metadata but not considered sufficient session material. This helper does not define adapter-level capability requirements: VNT-004 FR catalog spot checks showed that catalog search currently requires a cookie-backed public session, while `X-Anon-Id` alone was not sufficient in those spot checks. CSRF is optional for public session acquisition because the FR homepage reproduction did not expose a CSRF token.

## ADR-0007 - Catalog search adapter boundary

Date: 2026-09-21  
Status: Accepted

Public catalog search is implemented behind `VintedCatalogClient` in `packages/vinted-client`. The adapter receives a `VintedSession` or session provider plus an injected `VintedTransport`, so search logic does not know about `fetch()` and can be wrapped by `DiagnosticTransport`.

The verified VNT-004 contract maps internal input fields to current FR query parameters: `query -> search_text`, `priceFrom -> price_from`, `priceTo -> price_to`, `page -> page`, and `perPage -> per_page`. Additional filters such as brand/category/size/status/color remain future work until verified.

VNT-004A tightened the adapter boundary: `SearchItemsInput` rejects negative/non-finite price and pagination values, `price.amount` is normalized as a string, and `item_box.first_line`/`item_box.second_line` are treated as UI display metadata rather than reliable business fields for brand or size. Business fields should prefer explicit response properties such as `brand_title` and `size_title` when present.

## ADR-0008 - Public session acquisition language and market parsing

Date: 2026-09-21  
Status: Accepted

Public session acquisition does not send `Accept-Language` by default. Callers may provide an explicit `acceptLanguage`, but the locale observed in the Vinted response remains the source of truth when present.

`parseVintedMarketUrl` uses a documented allowlist of known `www.vinted.*` domains instead of accepting any hostname starting with `www.vinted.`. This rejects deceptive hosts such as `www.vinted.evil-example.com` and maps multi-label domains such as `www.vinted.co.uk` to an explicit market code (`GB`) rather than deriving a naive `CO.UK` value.
