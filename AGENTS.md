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
