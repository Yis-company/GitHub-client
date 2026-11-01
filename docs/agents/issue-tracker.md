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
