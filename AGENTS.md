# AGENTS.md - Vinted Automation Platform

Persistent repository instructions for Codex.

## Mission

Build the project described by `PRD.md` incrementally, with current priority defined by `context/00_PROJECT_STATE.md` and `tasks/BACKLOG.md`.

Do not jump ahead while Phase 0 foundations or API verification are incomplete.

## Mandatory Context Load

At the beginning of every new task/session, read in this order:

1. `context/00_PROJECT_STATE.md`
2. `PRD.md`
3. `TECH_SPEC.md`
4. `context/02_DECISIONS.md`
5. `context/03_API_CAPABILITY_MAP.md`
6. `context/05_OPEN_QUESTIONS.md`
7. `tasks/BACKLOG.md`

Read `context/04_RESEARCH_SOURCES.md` whenever working on Vinted network/API behavior.
Read `context/06_AGENT_LOG.md` when continuing previous work or when task history matters.

Before editing, identify which backlog item is being executed. If none matches, create or propose a new task entry before broad implementation.

## Evidence Discipline

Capability states are `UNKNOWN -> FOUND -> VERIFIED -> IMPLEMENTED`, with `BROKEN` for regressions.

- `FOUND` requires credible source/code/network evidence.
- `VERIFIED` requires current reproduction in an authorized context.
- `IMPLEMENTED` requires typed integration, tests and documentation.

Never invent or guess a Vinted endpoint, payload or required header and present it as implemented fact.

## Reverse-Engineering Boundary

Allowed research focuses on public marketplace traffic, published/open-source implementations, and requests made by the user's own authorized Vinted browser/account context.

Do not implement credential theft, session hijacking, CAPTCHA solving, allowlist bypasses, or stealth mechanisms whose primary purpose is defeating access controls.

## Engineering Rules

- Prefer TypeScript strict mode.
- Keep raw Vinted DTOs inside the Vinted client package.
- Normalize external data before exposing it to application/domain code.
- Avoid `any` unless isolated and justified at an external boundary.
- Parse external data defensively.
- Use explicit typed errors.
- Do not log secrets.
- Make unstable capabilities feature-flagged.
- Favor small modules over monolithic bot scripts.

## Tests And Verification

For every code task:

- run the smallest relevant tests during iteration;
- before completion run typecheck, lint and tests relevant to touched packages;
- report failures honestly;
- never mark a capability `IMPLEMENTED` if verification failed.

Any parser for Vinted responses should have sanitized fixture tests.

## Security

Never commit real cookies, passwords, session exports, bearer tokens, API secrets or private user data fixtures.

Maintain `.env.example` with placeholders only. Redact sensitive request/response fields in diagnostics.

## Completion Response

At the end of a task, summarize what changed, verification run, capability/context updates, blockers/risks and the most logical next backlog item.
