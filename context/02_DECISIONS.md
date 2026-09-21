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

Rationale: Vinted Bot should have one stable runtime baseline for strict TypeScript, diagnostics, future transport behavior and CI. The current local shell reports Node 23.6.1, so npm emits an engine warning until the shell is switched to Node 24.

## ADR-0005 - Instrument transports through diagnostic sinks

Date: 2026-09-21  
Status: Accepted

HTTP diagnostics are implemented as a wrapper around `VintedTransport`, not inside future endpoint adapters. `DiagnosticTransport` emits a redacted structured exchange to a `DiagnosticSink`; current sinks include memory and console implementations. This keeps future sinks such as JSONL files, database persistence or remote observability independent from catalog/search/message implementations.

## Known dev dependency advisories

Date: 2026-09-21  
Status: Monitoring

`npm audit` reports advisories in the Vitest/Vite/esbuild development-tooling chain, including items with no direct fix available from the current dependency graph. No mass upgrade or forced audit fix was applied during `VNT-002` because that would be unrelated dependency churn. Revisit when upgrading the test stack or when a fixed Vitest/Vite release is available.

## ADR-0006 - Public anonymous session usability

Date: 2026-09-21  
Status: Accepted

A public Vinted session is considered empty when it has no cookies, no `X-Anon-Id`, no CSRF token and no locale. It is considered usable when at least one public network identity signal is present: parsed `Set-Cookie` values or `X-Anon-Id`.

Locale alone is useful metadata but not considered sufficient for a usable session. CSRF is optional for public session acquisition because the FR homepage reproduction did not expose a CSRF token.

## ADR-0007 - Catalog search adapter boundary

Date: 2026-09-21  
Status: Accepted

Public catalog search is implemented behind `VintedCatalogClient` in `packages/vinted-client`. The adapter receives a `VintedSession` or session provider plus an injected `VintedTransport`, so search logic does not know about `fetch()` and can be wrapped by `DiagnosticTransport`.

The verified VNT-004 contract maps internal input fields to current FR query parameters: `query -> search_text`, `priceFrom -> price_from`, `priceTo -> price_to`, `page -> page`, and `perPage -> per_page`. Additional filters such as brand/category/size/status/color remain future work until verified.
