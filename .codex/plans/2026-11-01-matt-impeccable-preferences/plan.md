# Apply the confirmed setup preferences

Date: 2026-11-01
Status: Revision draft for approval

## Confirmed choices

Yi answered the setup interview: use separate domain contexts per package, keep `AGENTS.md`, and start future landing/showcase surfaces with an image composition. These choices replace the earlier single-context and unset-default recommendations. The original approval record remains intact.

## Smallest useful change

Update the agent/domain pointers, add a root glossary map with package responsibilities and lazy target paths, and store `"buildPath": "comp"` in the selected desktop app's `.impeccable/config.json`. App screens and documents remain code-first under Impeccable's workflow; this setting governs landing/showcase surfaces only.

Keep glossary/ADR content lazy. Do not invent domain terms or create empty package documents. Existing Linear routing, product facts, architecture, visual authority and live-picker settings remain intact. No application code or external writes.

## Evidence and scope

The bound repository is GitHub-client. Current `AGENTS.md` and `docs/agents/domain.md` still specify one root context. There is no glossary map or existing build-default config to merge. The approved init resolved `apps/desktop` as Impeccable's project root. Its init workflow stores the chosen default in `.impeccable/config.json`, separately from PRODUCT.md. There is no `.codegraph/` directory. The existing 49 dirty files were captured byte for byte before this revision.

## Sequence, ownership and acceptance

1. **Yi reviews the exact drafts below.** Codex renders this revision with `html-plan` and runs the required Plannotator gate. A changed or dismissed review does not authorize edits; an approved review permits this revision.
2. **Codex applies only the four reviewed files.** Dependency: approval. Retain the existing `AGENTS.md` content around the changed domain pointer and preserve the domain authority references.
3. **Codex verifies the result.** Check the four files against the approved drafts, validate the JSON value, verify all context directories exist, and check that the glossary/ADR paths remain lazy. Confirm product/tracker/live settings and all unrelated dirty bytes remain intact. Run whitespace/diff checks. Application tests are unnecessary for this documentation/configuration revision.

## Exact proposed files

### `AGENTS.md`

```markdown
# GitHub-client agent guidance

Keep changes small, readable and within the requested goal. Fix root causes. Do not introduce hashing without Yi's decision. Questions are read-only. Preserve unrelated dirty work; do not kill dev servers, wipe directories or create worktrees to bypass history/conflicts. Stop and ask if history or conflicts block the task.

For substantive planning, investigate first, write `plan.md` and render `plan.html` with `html-plan` under `.codex/plans/<YYYY-MM-DD>-<slug>/`. Review with `plannotator annotate <plan.html> --gate --json --require-approval --result-file <review.json>`. Implement only after approval. Use CodeGraph before source exploration when `.codegraph/` exists.

## Agent skills

### Issue tracker

Use the existing Linear Github client team and appropriate project. See `docs/agents/issue-tracker.md`.

### Domain docs

Use separate domain documentation contexts for `apps/desktop`, `packages/core` and `packages/ui`, indexed by `GLOSSARY-MAP.md`. Create glossary and ADR content lazily. See `docs/agents/domain.md`.

### Product context

For the desktop interface, read `apps/desktop/PRODUCT.md`. `packages/ui` supplies its shared components. Existing styles/components and any future applicable `DESIGN.md` remain visual authority; product initialization does not authorize redesign.
```

### `docs/agents/domain.md`

```markdown
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
```

### `GLOSSARY-MAP.md`

```markdown
# Glossary map

Yi selected one documentation context per workspace package. Read only the contexts relevant to the task; work across packages needs each affected context. This map does not introduce separate products, runtime boundaries or new architecture layers.

| Context | Responsibility | Glossary | Package ADRs |
| --- | --- | --- | --- |
| `apps/desktop` | Desktop workflows, navigation, local interaction state and platform integration | `apps/desktop/GLOSSARY.md` | `apps/desktop/docs/adr/` |
| `packages/core` | Shared GitHub/domain types, API clients, collections, synchronization and actions | `packages/core/GLOSSARY.md` | `packages/core/docs/adr/` |
| `packages/ui` | Shared UI primitives, component vocabulary and reusable interaction contracts | `packages/ui/GLOSSARY.md` | `packages/ui/docs/adr/` |

Glossaries and ADR directories are created only when terms or decisions are resolved. Missing paths are intentional; proceed without scaffolding empty documents. Cross-package decisions belong in root `docs/adr/` when needed. Reuse core definitions in consuming packages instead of duplicating or redefining them.

See `docs/agents/domain.md` for consumer rules and existing decision authorities. Desktop product context remains in `apps/desktop/PRODUCT.md`.
```

### `apps/desktop/.impeccable/config.json`

```json
{
  "buildPath": "comp"
}
```

## Approval rule

The project `AGENTS.md` requires a rendered plan and `plannotator annotate <plan.html> --gate --json --require-approval --result-file <review.json>` before substantive setup changes. The Matt setup skill requires draft confirmation before writing configuration. This revision contains the exact implementation of the newly confirmed choices, without reopening the interview.
