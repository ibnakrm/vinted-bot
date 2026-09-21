# Technical Specification - Vinted Automation Platform

Status: Draft V0.1  
Last updated: 2026-09-19

## Architecture Principles

- Full-code implementation.
- TypeScript-first unless a researched dependency justifies another runtime.
- The product owns its Vinted client implementation.
- Third-party wrappers are research references, not core dependencies by default.
- Vinted endpoint volatility is contained behind adapters.
- Frontend must never directly own long-lived Vinted session secrets.
- Write capabilities are implemented only after endpoint/payload/auth behavior is verified.

## Stack

Current repository decision:

- Monorepo: npm workspaces.
- Runtime: Node 24 LTS.
- Language: TypeScript strict mode.
- Tests: Vitest.
- Linting: ESLint flat config.

Original proposal remains under observation:

- Netlify for UI/control plane and short request-response functions.
- Worker/runtime for polling to be validated separately.
- Supabase/PostgreSQL candidate for persistence/auth.
- Zod and Playwright may be added when their use is justified by a specific task.

## Repository Layout

```text
/
├── AGENTS.md
├── README.md
├── PRD.md
├── TECH_SPEC.md
├── context/
├── tasks/
├── packages/
│   ├── domain/
│   └── vinted-client/
└── fixtures/
    └── vinted/
```

`apps/`, `workers/`, `database/` and UI code are intentionally deferred until the foundation and public catalog research are stable.

## Domain Boundary

`packages/domain` owns internal types such as items, sellers, search definitions and capability states. Raw Vinted JSON must not leak into domain code.

## Vinted Client Boundary

`packages/vinted-client` owns:

- site/API host resolution;
- session lifecycle types;
- headers/request metadata;
- transport contract;
- endpoint adapters in future tasks;
- raw DTOs and Vinted-specific parsing.

## Session Model

```ts
export interface VintedSession {
  cookies: Record<string, string>;
  anonId?: string;
  csrfToken?: string;
  locale?: string;
  acquiredAt: string;
  expiresAt?: string;
}
```

Raw session values must never be logged.

## Transport Contract

```ts
interface VintedTransport {
  request<T>(request: VintedRequest): Promise<VintedResponse<T>>;
}
```

The transport layer must support explicit methods, site/API host classes, timeout, request IDs, redacted diagnostics and typed errors. Retry/session refresh behavior will be added only when the exact behavior is researched and tested.

## Capability Lifecycle

```text
UNKNOWN -> FOUND -> VERIFIED -> IMPLEMENTED
                 \-> BROKEN
```

- `UNKNOWN`: no credible endpoint/payload found.
- `FOUND`: credible code/network evidence exists.
- `VERIFIED`: behavior reproduced against a current authorized context.
- `IMPLEMENTED`: typed adapter, tests and documentation exist.
- `BROKEN`: previously usable behavior no longer works.

## Current Research Baseline

- Public catalog search is hypothesized from recent research to use `/svc-catalogue/items` on an `api.` Vinted host.
- Legacy `/api/v2/catalog/items` must not be assumed current.
- Historical message-thread code used `/api/v2/users/{user_id}/msg_threads`.
- Current write endpoints remain unknown.

Treat these as hypotheses according to their recorded status, not permanent API contracts.

## Deployment Notes

Netlify is a good fit for frontend, authenticated UI, short functions and previews. Frequent polling, persistent workers, queues, high-frequency schedulers and long-lived browser/session workloads need separate validation.

## Security Requirements

- Never commit Vinted cookies, credentials, JWTs or session dumps.
- `.env*` containing real secrets must be ignored.
- Redact `cookie`, `authorization`, CSRF and session identifiers in logs.
- Apply access control server-side on every account-scoped operation.
- Avoid mechanisms whose purpose is bypassing an access-control allowlist.

## Testing Strategy

- Unit tests for domain validation, URL/host resolution, request normalization, response normalization, retry decisions and redaction.
- Contract fixture tests using sanitized raw responses from verified research.
- Integration tests only with explicitly configured test credentials/session and never by default in CI.
