# Domain docs

## Layout and consumer rules

Use separate domain documentation contexts for `apps/desktop`, `packages/core` and `packages/ui`, as selected by Yi. Root `GLOSSARY-MAP.md` indexes them; package documentation boundaries do not change the application architecture.

- Read root `GLOSSARY-MAP.md`, then the relevant package glossary and ADRs before exploring an area. Read root `docs/adr/` for cross-package decisions when present.
- For work spanning packages, read each affected context. Shared core terminology remains consistent in desktop and UI consumers; do not invent different meanings for the same GitHub concept.
- Glossaries live at `<package>/GLOSSARY.md`; package decisions live at `<package>/docs/adr/`. The map lists the exact paths and responsibilities.
- When a glossary or ADR directory is absent, proceed silently. Do not create empty files or directories. `domain-modeling` records resolved terms and decisions lazily in the applicable context.
- Use the applicable glossary's vocabulary in issues, code and tests. Identify conflicting definitions or ADRs explicitly rather than silently overriding them.

## Existing authorities

- Product: `apps/desktop/PRODUCT.md`.
- Original approved product/architecture: `.claude/plans/2026-09-25-github-client/plan.md`.
- Approved revised data/platform implementation: `.claude/plans/2026-09-25-v1-implementation/plan.md` (TanStack DB/SQLite persistence, injected platform services, small Rust shell, Bun/Turborepo).
- Later approved inbox/navigation/settings decisions: `.codex/plans/2026-09-26-pr-inbox-navigation/plan.md`.

Preserve later scoped decisions over earlier proposals. These plans are decision evidence, not proof of current runtime behavior or CI. Inspect current source/tests before asserting implementation status. `packages/core` stays free of DOM/native dependencies; the documentation contexts do not introduce new runtime layers or change package dependencies.
