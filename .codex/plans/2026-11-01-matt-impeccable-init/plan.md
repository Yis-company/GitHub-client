# Initialize Matt and Impeccable

Date: 2026-11-01
Project: `/Users/yitam/Documents/code/ybtam/GitHub-client`
Status: Draft; setup files require the interview choices and Plannotator approval below.

## Outcome and scope

Add useful local engineering guidance and durable product context for the owned desktop app. Retain the existing tracker, architecture, product behavior and visual implementation. No application code, redesign, migrations, deployments, credentials, external writes, commits or pushes.

Yi confirms configuration and approves this draft. Codex writes the approved files and verifies their scope and consistency.

## Confirmed decisions

- Keep Linear as the issue tracker. Live verification resolves the old project slug to **GitHub-client v1 build / P-GIT-100**, in **Github client / GIT**. The build project is completed; existing follow-ups have their own projects. Old `SID-68` resolves to `GIT-27` in v1 release.
- Primary user: Yi, working daily with PRs, reviews and Actions. Retain the approved fast, keyboard-first, cached desktop product direction.
- Impeccable platform: `web`, describing the shared React interface inside Tauri. Desktop native services remain behind platform adapters. Hosted web and mobile are future scope.
- Target: `apps/desktop`. `packages/ui` is the shared component library, not another product requiring its own product record.

## Remaining choices proposed for approval

1. Domain layout: recommend one root glossary and ADR directory, created lazily. The workspace packages share one product domain; package boundaries do not require separate domain authorities.
2. Instruction file: neither root `AGENTS.md` nor `CLAUDE.md` exists. Recommend creating `AGENTS.md`; the Matt skill requires Yi's selection.
3. Optional landing/showcase build default: recommend leaving it unset. App screens and documents are code-first either way. Only store `buildPath` if Yi explicitly chooses a value.

The drafts below use those recommendations. Yi may answer the pending interview questions or confirm these exact choices by approving this complete draft. Any different choice requires updating this draft before review approval. Silence confirms nothing.

## Investigation and evidence

- Correct repository and remote: `https://github.com/Yis-company/GitHub-client`. HEAD at inspection: `94528f1cad80`. No unmerged index entries, merge or rebase in progress. No `.codegraph/`; CodeGraph skipped.
- Existing dirty state: `.changeset/config.json` and untracked skill folders under `.agents`, `.claude`, `.hermes`, `.trae`. Preserve all 41 existing dirty files byte for byte. No skill installation or replacement is needed for this setup.
- No existing root agent instructions, `docs/agents`, glossary/map, ADRs, `PRODUCT.md`, `DESIGN.md`, or Impeccable config were found. Installed skills alone do not supply their project context. `triage` is absent locally and from available shared skills: omit its configuration and remote labels.
- Product and architecture authority: approved `.claude/plans/2026-09-25-github-client/plan.md`; approved revised implementation plan in `.claude/plans/2026-09-25-v1-implementation/plan.md`; approved inbox/navigation plan in `.codex/plans/2026-09-26-pr-inbox-navigation/plan.md`. Preserve later scoped decisions over earlier proposals; do not treat historical verification as current runtime proof.
- Current source: `README.md`, workspace manifests, desktop routes, platform adapters, shortcut handling, theme provider, app CSS and shared UI tokens. Native HTTP/keychain/SQLite are injected; core remains independent of DOM/native APIs. Release workflow defines Linux, macOS and Windows builds; this inspection does not prove runtime acceptance on those OSes.
- Impeccable context at repo root detected `desktop` and `ui`, both missing product/design files. Re-running from the selected desktop child resolved `apps/desktop` as the project root and found incumbent UI. Its current styles/components remain visual authority.
- Browser development exists at Vite port 5173 with HMR and `apps/desktop/index.html` as the entry. `impeccable detect-csp` from that app returned `shape: null`, `signals: []`. A live-picker configuration can be written without injection, a running server or a CSP edit.
- Linear read-only verification on 2026-11-01 found the current GIT team and five project URLs recorded below. The advertised `get_agent_context` tool returned “Tool get_agent_context not found”; current project/issue reads succeeded. No external mutation occurred.

## Sequence and acceptance

1. **Yi: settle the interview choices.** Dependency: repository investigation, already complete. Update this plan and drafts if the choices differ.
2. **Yi: review the complete draft.** Codex renders this Markdown to responsive `plan.html` with `html-plan`, checks wide/narrow rendering, then runs `plannotator annotate <plan.html> --gate --json --require-approval --result-file <review.json>`. Feedback requires revision and another review. Dismissal is not approval.
3. **Codex: write the approved setup.** Dependency: approved review. Create only the files in the next section, accounting for any newly existing files before writing. Keep original decisions and dirty files intact.
4. **Codex: verify and report.** Check local Markdown links, JSON shape, the exact platform/schema marker, one Agent skills block and absence of triage configuration. Compare all 41 original dirty files byte for byte, review `git diff --check` and the final changed-file inventory. Documentation/configuration checks are appropriate; app tests, native launch and remote CI are not needed for this scope. State their absence plainly.

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

Use one root domain context; create glossary and ADRs only as real terms and decisions are resolved. See `docs/agents/domain.md`.

### Product context

For the desktop interface, read `apps/desktop/PRODUCT.md`. `packages/ui` supplies its shared components. Existing styles/components and any future applicable `DESIGN.md` remain visual authority; product initialization does not authorize redesign.
```

### `docs/agents/issue-tracker.md`

```markdown
# Issue tracker: Linear

GitHub-client work lives in the existing Linear **Github client** team (`GIT`), workspace `abrian`. GitHub is the source/PR host; do not create GitHub issues as a substitute for Linear tickets.

## Existing projects

Verified read-only on 2026-11-01. Resolve current project metadata before a write; this table is routing guidance, not current delivery evidence.

| Scope | Project |
| --- | --- |
| Original v1 build | [P-GIT-100: GitHub-client v1 build](https://linear.app/abrian/project/github-client-v1-build-b4abc69a1ab2) |
| Desktop verification, installers, signing | [P-GIT-116: GitHub-client v1 release](https://linear.app/abrian/project/github-client-v1-release-6e08e6f12c87) |
| Existing v1 limitations | [P-GIT-117: GitHub-client v1 polish](https://linear.app/abrian/project/github-client-v1-polish-5c25e96ecabe) |
| Local repositories and v2 leftovers | [P-GIT-118: GitHub-client v2 local repositories](https://linear.app/abrian/project/github-client-v2-local-repositories-6ba318c8fbc1) |
| Server, hosted web, mobile | [P-GIT-119: GitHub-client Phase 2: server, web and mobile](https://linear.app/abrian/project/github-client-phase-2-server-web-and-mobile-e769c8e6b123) |

The v1 build project was completed at verification. Route follow-ups by scope; do not default all new work into that project. Older plans use Side Projects / SID identifiers. Resolve those through Linear and retain historical references; for example, `SID-68` now resolves to `GIT-27` in v1 release.

## Skill operations

- **Fetch the relevant ticket:** read the supplied Linear issue key, UUID or URL through the connected Linear tools. Read its description, acceptance criteria, related work and dependencies before proposing changes.
- **Publish to the issue tracker:** when requested, create a Linear issue in the existing GIT team and matching project. Search for duplicates first. Reuse existing labels/statuses; do not invent a workflow or create labels as part of setup.
- **Specs and implementation tickets:** keep the spec and its scoped child work in Linear; retain source, plan and related-issue links. Preserve existing ownership and dependency relationships. Ask when project routing is materially ambiguous.
- **Wayfinding, when requested:** use a parent Linear issue as the map, related child issues as tickets, and existing issue dependencies for blockers. Reuse project workflow; do not scaffold labels or a board preemptively.
- **Read versus write:** an inspection or question is read-only. Tracker configuration grants no standing permission to create, comment, claim, relabel, close or otherwise change external issues. If the connector is unavailable, report the limit instead of silently switching trackers.

PRs remain code-review artifacts, not an incoming feature-request triage queue.
```

### `docs/agents/domain.md`

```markdown
# Domain docs

## Layout and consumer rules

Use one domain context across `apps/desktop`, `packages/core` and `packages/ui`.

- Read root `GLOSSARY.md` when present and relevant ADRs in `docs/adr/` before exploring an area.
- If a future approved split introduces root `GLOSSARY-MAP.md`, follow its relevant context pointers instead.
- When those files are absent, proceed silently. Do not create empty glossary/ADR scaffolding; `domain-modeling` records actual resolved terminology and decisions lazily.
- Use the glossary's vocabulary in issues, code and tests. If a proposed change contradicts an ADR, identify the conflict and seek the scoped decision rather than silently overriding it.

## Existing authorities

- Product: `apps/desktop/PRODUCT.md`.
- Original approved product/architecture: `.claude/plans/2026-09-25-github-client/plan.md`.
- Approved revised data/platform implementation: `.claude/plans/2026-09-25-v1-implementation/plan.md` (TanStack DB/SQLite persistence, injected platform services, small Rust shell, Bun/Turborepo).
- Later approved inbox/navigation/settings decisions: `.codex/plans/2026-09-26-pr-inbox-navigation/plan.md`.

Preserve later scoped decisions over earlier proposals. These plans are decision evidence, not proof of current runtime behavior or CI. Inspect current source/tests before asserting implementation status. `packages/core` stays free of DOM/native dependencies; package boundaries alone do not justify separate glossaries or architecture layers.
```

### `apps/desktop/PRODUCT.md`

```markdown
# GitHub-client

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Yi is the primary user: a senior full-stack developer who reviews more code than he writes and works with pull requests, reviews and GitHub Actions daily.

## Product Purpose

A fast, keyboard-first desktop client that replaces routine GitHub website use for PRs, diff review and Actions. Success means less navigation latency and fewer interruptions while finding work, reviewing changes and understanding CI.

## Operating Context

The owned product is `apps/desktop`: one React interface inside a Tauri shell. Native services are supplied by platform adapters; this platform classification does not imply a hosted-web product or a separate native design language per OS. Linux, macOS and Windows builds are defined in the release workflow; runtime acceptance must be verified separately.

The same UI can run in browser development mode (`bun --cwd apps/desktop dev`, port 5173). That mode uses tab-scoped token storage and browser SQLite/OPFS, with an in-memory fallback; it has different capabilities from Tauri, including CORS limits on Actions logs.

## Capabilities and Constraints

- PR inbox and organization/team/starred browsing, PR detail, diff review with inline comments and suggestions, review/merge actions, Actions runs/jobs/steps/logs and workflow controls, command palette and keyboard shortcuts.
- Inbox Active/Snoozed/Settled state is local and account-scoped. Settling does not close or merge a GitHub PR. Failures remain visible across local states; displaying them does not cancel snooze.
- GitHub repository settings are bounded by supported fields and admin capability; saves require server confirmation. Preserve permission/error handling and truthful freshness/status feedback.
- Screens consume TanStack DB collections with SQLite persistence and background synchronization. Cached data is not proof of current remote state. Core GitHub/domain logic stays independent of DOM/native services.
- Desktop authentication uses a classic PAT, environment token or GitHub CLI import, with OS keychain storage. Browser-development storage is a separate convenience, not the desktop credential model.
- API diff truncation and log-availability limits remain constraints. Do not promise complete PR coverage or true live step-log streaming without evidence.
- Local repositories, Git Town, agent launch, hosted service and mobile are future scope requiring separate approval. A full IDE, a full git client and embedded agent sessions are outside the approved product direction.

## Brand Commitments

`GitHub-client` and `@github-client/*` are the existing working names. Naming was reserved for separate review in the approved product plan; setup does not settle a public brand or rename assets.

## Evidence on Hand

- Repository `README.md`, current desktop routes/platform adapters, shared `packages/ui`, and core domain/actions/sync code establish the implementation context; they do not prove live-operation acceptance.
- Approved product/architecture and revised implementation plans: `.claude/plans/2026-09-25-github-client/plan.md` and `.claude/plans/2026-09-25-v1-implementation/plan.md` from the repo root.
- Later approved inbox/navigation/settings plan: `.codex/plans/2026-09-26-pr-inbox-navigation/plan.md` from the repo root.
- Existing UI components, styles and assets remain visual authority. This record introduces no visual direction, palette, component rules or redesign authorization.

## Product Principles

1. Keep daily review work fast and keyboard-efficient, with useful cached content while refresh runs in the background.
2. Keep local organization distinct from GitHub mutations, and make permissions, freshness and action outcomes truthful.
3. Keep product and architecture complexity low; reuse the shared core and platform seams, and scope future capabilities separately.

## Accessibility & Inclusion

Keyboard operation is a confirmed product requirement. Preserve focus and navigation through lists, panes, disclosures and actions. Failure/status meaning must remain understandable beyond color. No additional product-specific conformance target has been confirmed.
```

### `apps/desktop/.impeccable/live/config.json`

```json
{
  "files": ["index.html"],
  "insertBefore": "</body>",
  "commentSyntax": "html",
  "cspChecked": true
}
```

This is configuration for optional future browser iteration. The CSP check above supports `cspChecked`; setup does not run live mode, start a dev server, inject scripts, change HTML/CSP or enable hooks. It does not validate native runtime behavior.

## Intentionally omitted or deferred

- No triage labels/configuration: `triage` is not installed.
- No empty glossary, ADRs, domain maps or new architecture decisions.
- No `DESIGN.md`: Impeccable init captures product truth only; incumbent UI authority remains intact.
- No second product record for the shared UI package or a future hosted/mobile app.
- No image build default unless Yi explicitly chooses one. The desktop app uses code-first; an unset landing/showcase default remains unset.
- No skill bundle installation, hooks, app changes or external tracker changes.

## Approval rule

The Matt skill says “Show the user a draft” and “Let them edit before writing.” Impeccable init requires “one real answer or approval round before writing a new PRODUCT.md.” The project rule requires the HTML plan gate before implementation. Interview responses confirm facts; only the subsequent approved plan review authorizes writing these setup files.
