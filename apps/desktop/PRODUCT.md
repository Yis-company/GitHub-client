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
