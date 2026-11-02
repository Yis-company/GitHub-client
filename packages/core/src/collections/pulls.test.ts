import { afterEach, beforeEach, expect, test } from "vitest"
import type { Group, PullRequest, PullRequestDetail, PullRequestFiles } from "../domain/types"
import { tempDatabase } from "../test/persistence"
import { createActionsCollections } from "./actions"
import { ensureRepository } from "./identities"
import { NormalizedDatabase } from "./normalized"
import {
  type CanonicalPullInput,
  createPullCollections,
  ensurePullIdentity,
  ingestPullRequest,
  ingestPullRequests,
  type PullCollections,
} from "./pulls"

let sqlite: ReturnType<typeof tempDatabase>
beforeEach(() => {
  sqlite = tempDatabase()
})
afterEach(() => sqlite.close())

async function batchSetup() {
  const db = new NormalizedDatabase(sqlite.open())
  const collections = createPullCollections(db)
  await db.ready()
  const repositoryId = await ensureRepository(db, { fullName: "acme/widget" })
  const input = (fields: Partial<CanonicalPullInput> = {}): CanonicalPullInput => ({
    repositoryId,
    number: 12,
    observedAt: "2026-10-26T12:00:00Z",
    title: "Fresh title",
    ...fields,
  })
  return { db, collections, input }
}

test("batch identity resolution enriches sparse parents and preserves ordered duplicate and incompatible node IDs", async () => {
  const { db, collections, input } = await batchSetup()
  const sparse = await ensurePullIdentity(db, { repo: "acme/widget", number: 12 })
  expect(collections.canonical.pullRequests.collection.get(sparse)).toMatchObject({ number: 12 })
  expect(collections.canonical.pullRequests.collection.get(sparse)?.title).toBeUndefined()
  const ids = await ingestPullRequests(db, [
    input({ nodeId: "PR_first" }),
    input({ title: "Route update" }),
    input({ nodeId: "PR_other", title: "Incompatible node" }),
    input({ nodeId: "PR_first", title: "Final title" }),
    input({ number: 13, title: "New route" }),
    input({ number: 13, nodeId: "PR_enriched", title: "Enriched in batch" }),
  ])
  expect(ids.slice(0, 2)).toEqual([sparse, sparse])
  expect(ids[2]).not.toBe(sparse)
  expect(ids[3]).toBe(sparse)
  expect(ids[4]).toBe(ids[5])
  expect(db.rows(collections.canonical.pullRequests)).toHaveLength(3)
  expect(collections.canonical.pullRequests.collection.get(sparse)).toMatchObject({
    nodeId: "PR_first",
    title: "Final title",
  })
  expect(collections.canonical.pullRequests.collection.get(ids[4]!)).toMatchObject({
    nodeId: "PR_enriched",
    title: "Enriched in batch",
  })
  expect(await ingestPullRequests(db, [])).toEqual([])
})

test.each(["fresh then stale", "stale then fresh"])(
  "batch freshness retains rich scalars and edges: %s",
  async (order) => {
    const { db, collections, input } = await batchSetup()
    const fresh = input({
      nodeId: "PR_fresh",
      source: "detail",
      author: { id: "U_alice", login: "alice" },
      state: "MERGED",
      stateObservedAt: "2026-10-26T12:00:00Z",
      headOid: "rich-head",
      labels: [{ id: "L_ready", name: "ready", color: "00ff00" }],
      labelsComplete: true,
      reviewRequests: ["bob", "acme/reviewers"],
      reviewRequestsComplete: true,
    })
    const stale = input({
      nodeId: "PR_fresh",
      observedAt: "2026-10-25T12:00:00Z",
      source: "list",
      title: "Stale title",
      author: null,
      state: "OPEN",
      headOid: "old-head",
      labels: [],
      labelsComplete: false,
      reviewRequests: [],
      reviewRequestsComplete: false,
    })
    const ids = await ingestPullRequests(
      db,
      order === "fresh then stale" ? [fresh, stale] : [stale, fresh],
    )
    expect(ids[0]).toBe(ids[1])
    expect(collections.canonical.pullRequests.collection.get(ids[0]!)).toMatchObject({
      title: "Fresh title",
      state: "MERGED",
      headOid: "rich-head",
      detailObservedAt: fresh.observedAt,
      scalarObservedAt: fresh.observedAt,
      labelsComplete: true,
      reviewRequestsComplete: true,
    })
    expect(collections.readPullSummary(ids[0]!)).toMatchObject({
      user: { login: "alice" },
      labels: [{ name: "ready" }],
      requested_reviewers: [{ login: "bob" }],
      requested_teams: [{ slug: "acme/reviewers" }],
    })
  },
)

test("ordered batch inputs preserve absent authors and incomplete edges, clear explicit null/complete edges and keep MERGED terminal", async () => {
  const { db, collections, input } = await batchSetup()
  const [id] = await ingestPullRequests(db, [
    input({
      author: { login: "alice" },
      state: "MERGED",
      labels: [{ name: "keep", color: "00ff00" }],
      reviewRequests: ["bob"],
      labelsComplete: true,
      reviewRequestsComplete: true,
    }),
    input({
      observedAt: "2026-10-27T12:00:00Z",
      title: "New scalar",
      state: "OPEN",
      labels: [],
      labelsComplete: false,
      reviewRequests: [],
      reviewRequestsComplete: false,
    }),
    input({
      observedAt: "2026-10-28T12:00:00Z",
      state: "CLOSED",
      stateObservedAt: "2026-10-25T12:00:00Z",
    }),
  ])
  expect(collections.readPullSummary(id!)).toMatchObject({
    user: { login: "alice" },
    labels: [{ name: "keep" }],
    requested_reviewers: [{ login: "bob" }],
  })
  expect(collections.canonical.pullRequests.collection.get(id!)).toMatchObject({
    state: "MERGED",
    stateObservedAt: "2026-10-26T12:00:00Z",
    labelsComplete: false,
    reviewRequestsComplete: false,
  })
  await ingestPullRequests(db, [
    input({
      observedAt: "2026-10-29T12:00:00Z",
      author: null,
      labels: [],
      labelsComplete: true,
      reviewRequests: [],
      reviewRequestsComplete: true,
    }),
    input({ observedAt: "2026-10-30T12:00:00Z" }),
  ])
  expect(collections.canonical.pullRequests.collection.get(id!)?.authorId).toBeNull()
  expect(collections.readPullSummary(id!)).toMatchObject({
    labels: [],
    requested_reviewers: [],
    requested_teams: [],
  })
})

test("batch reviewer/author identity enrichment and repeated edge snapshots match sequential ingestion", async () => {
  const { db, collections, input } = await batchSetup()
  const inputs = [
    input({
      number: 1,
      nodeId: "PR_one",
      reviewRequests: ["bob"],
      labels: [{ name: "old", color: "ff0000" }],
    }),
    input({
      number: 2,
      nodeId: "PR_two",
      author: { id: "U_bob", login: "bob", avatarUrl: "avatar" },
      reviewRequestTargets: [{ kind: "user" as const, login: "alice", nodeId: "U_alice" }],
    }),
    input({
      number: 1,
      nodeId: "PR_one",
      author: { id: "U_alice", login: "alice" },
      labels: [{ name: "new", color: "00ff00" }],
      reviewRequests: ["carol"],
    }),
    input({
      number: 1,
      nodeId: "PR_one",
      observedAt: "2026-10-25T12:00:00Z",
      labels: [],
      reviewRequests: [],
    }),
  ]
  const ids = await ingestPullRequests(db, inputs)
  const secondFile = tempDatabase()
  try {
    const sequential = new NormalizedDatabase(secondFile.open())
    const other = createPullCollections(sequential)
    await sequential.ready()
    await ensureRepository(sequential, { fullName: "acme/widget" })
    const sequentialIds: string[] = []
    for (const value of inputs) sequentialIds.push(await ingestPullRequest(sequential, value))
    expect(ids).toEqual(sequentialIds)
    const snapshot = (database: NormalizedDatabase, canonical: PullCollections["canonical"]) => ({
      pulls: database.rows(canonical.pullRequests),
      actors: database.rows(canonical.actors),
      teams: database.rows(canonical.teams),
      labels: database.rows(canonical.labels),
      pullLabels: database.rows(canonical.pullLabels),
      reviewRequests: database.rows(canonical.pullReviewRequests),
    })
    expect(snapshot(db, collections.canonical)).toEqual(snapshot(sequential, other.canonical))
    const bob = db.rows(collections.canonical.actors).find((actor) => actor.login === "bob")!
    expect(bob).toMatchObject({ nodeId: "U_bob", key: db.key("actor", "bob") })
    expect(collections.canonical.pullRequests.collection.get(ids[1]!)?.authorId).toBe(bob.key)
    expect(collections.readPullSummary(ids[0]!)).toMatchObject({
      labels: [{ name: "new" }],
      requested_reviewers: [{ login: "carol" }],
    })
  } finally {
    secondFile.close()
  }
})

test("one persisted PR is shared across groups and detail, while removing one membership keeps the other", async () => {
  const database = new NormalizedDatabase(sqlite.open())
  const collections = createPullCollections(database)
  const actions = createActionsCollections(database)
  await database.ready()

  const groups: Group[] = ["team:acme/core", "org:acme"].map((id, order) => ({
    id,
    kind: order === 0 ? "team" : "org",
    name: order === 0 ? "acme/core" : "acme",
    org: "acme",
    order,
    ...(order === 0 ? { repos: ["acme/widget"] } : {}),
  }))
  await collections.repos.upsert([
    {
      fullName: "acme/widget",
      owner: "acme",
      name: "widget",
      private: false,
      archived: false,
      defaultBranch: "main",
      pushedAt: null,
    },
  ])
  await collections.groups.upsert(groups)

  const row = (groupId: string, syncedAt: string): PullRequest => ({
    key: `${groupId}:PR_node_1`,
    groupId,
    id: "PR_node_1",
    repo: "acme/widget",
    number: 12,
    title: "Normalize once",
    url: "https://github.com/acme/widget/pull/12",
    author: "alice",
    authorAvatarUrl: "https://avatars.example/alice.png",
    isDraft: false,
    createdAt: "2026-09-29T10:00:00Z",
    updatedAt: "2026-09-29T10:05:00Z",
    syncedAt,
    state: "OPEN",
    headOid: "head-1",
    headRef: "feature/normalize",
    baseRef: "main",
    reviewDecision: null,
    checkState: null,
    labels: [{ id: "label_1", name: "ready", color: "00aa00" }],
    reviewRequests: ["bob", "acme/reviewers"],
    comments: 0,
    additions: 3,
    deletions: 1,
  })
  await collections.pulls.upsert([
    row("team:acme/core", "2026-09-29T10:10:00Z"),
    row("org:acme", "2026-09-29T10:11:00Z"),
  ])

  const detail: PullRequestDetail = {
    key: "acme/widget#12",
    id: "PR_node_1",
    repo: "acme/widget",
    number: 12,
    title: "Normalize once",
    url: "https://github.com/acme/widget/pull/12",
    state: "OPEN",
    isDraft: false,
    author: { id: "actor_alice", login: "alice", avatarUrl: "https://avatars.example/alice.png" },
    bodyHTML: "",
    createdAt: "2026-09-29T10:00:00Z",
    headRef: "feature/normalize",
    headOid: "head-1",
    baseRef: "main",
    baseOid: "base-1",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    reviewDecision: null,
    mergeMethods: ["squash"],
    viewerCanUpdate: true,
    additions: 3,
    deletions: 1,
    changedFiles: 1,
    timeline: [
      {
        kind: "commit",
        id: "timeline_commit_1",
        oid: "head-1",
        messageHeadline: "Normalize PR data",
        author: "alice",
        authorIdentity: {
          id: "actor_alice",
          login: "alice",
          avatarUrl: "https://avatars.example/alice.png",
        },
        createdAt: "2026-09-29T10:04:00Z",
      },
    ],
    threads: [
      {
        id: "thread_1",
        path: "src/index.ts",
        line: 14,
        startLine: null,
        side: "RIGHT",
        isResolved: false,
        isOutdated: false,
        viewerCanResolve: true,
        comments: [
          {
            id: "comment_1",
            databaseId: 44,
            author: { id: "actor_bob", login: "bob", avatarUrl: "" },
            body: "Looks good",
            bodyHTML: "Looks good",
            createdAt: "2026-09-29T10:06:00Z",
          },
        ],
      },
    ],
    checks: [
      {
        id: "check_1",
        kind: "check-run",
        name: "tests",
        status: "COMPLETED",
        conclusion: "SUCCESS",
        url: null,
        workflowRunId: 99,
        workflowId: 9,
        workflowName: "CI",
      },
    ],
    observedAt: "2026-09-29T10:15:00Z",
  }
  await collections.pullDetails.upsert([detail])
  expect(collections.pullDetails.collection.get(detail.key)?.checks[0]?.workflowName).toBe("CI")
  expect(database.rows(collections.canonical.commits)[0]?.authorId).toBe(
    database.rows(collections.canonical.actors).find((actor) => actor.login === "alice")?.key,
  )

  const staleList = row("org:acme", "2026-09-29T10:12:00Z")
  staleList.title = "Stale list title"
  await collections.pulls.upsert([staleList])

  const incompleteDetail = {
    ...detail,
    observedAt: "2026-09-29T10:20:00Z",
    timelineComplete: false,
    timeline: [
      {
        kind: "event" as const,
        id: "event_2",
        actor: null,
        text: "partial page",
        createdAt: "2026-09-29T10:19:00Z",
      },
    ],
  }
  await collections.pullDetails.upsert([incompleteDetail])
  expect(database.rows(collections.canonical.timelineItems)).toHaveLength(2)
  await collections.pullDetails.upsert([
    {
      ...detail,
      observedAt: "2026-09-29T10:21:00Z",
      timeline: [],
    },
  ])

  const files: PullRequestFiles = {
    key: "acme/widget#12",
    headOid: "head-1",
    files: [
      {
        filename: "src/index.ts",
        previousFilename: null,
        status: "modified",
        additions: 3,
        deletions: 1,
        patch: "@@",
      },
    ],
  }
  await collections.pullFiles.upsert([files])

  expect(database.rows(collections.canonical.pullRequests)).toHaveLength(1)
  const canonicalPull = database.rows(collections.canonical.pullRequests)[0]!
  expect(canonicalPull.title).toBe("Normalize once")
  expect(canonicalPull).not.toHaveProperty("labels")
  expect(canonicalPull).not.toHaveProperty("reviewRequests")
  expect(canonicalPull).not.toHaveProperty("timeline")
  expect(canonicalPull).not.toHaveProperty("threads")
  expect(canonicalPull).not.toHaveProperty("checks")
  expect(database.rows(collections.canonical.groupPulls)).toHaveLength(2)
  expect(database.rows(collections.canonical.detailObservations)).toHaveLength(1)
  expect(database.rows(collections.canonical.pullLabels)).toHaveLength(1)
  expect(database.rows(collections.canonical.pullReviewRequests)).toHaveLength(2)
  expect(database.rows(collections.canonical.timelineItems)).toHaveLength(0)
  expect(database.rows(collections.canonical.commits)).toHaveLength(0)
  expect(database.rows(collections.canonical.reviewThreads)).toHaveLength(1)
  expect(database.rows(collections.canonical.reviewComments)).toHaveLength(1)
  expect(database.rows(collections.canonical.pullChecks)).toHaveLength(1)
  const check = database.rows(collections.canonical.checks)[0]!
  expect(check.workflowRunKey).toBe(database.key("workflowRun", 99))
  expect(check).not.toHaveProperty("workflowName")
  expect(check).not.toHaveProperty("workflowRunId")
  expect(database.rows(collections.canonical.files)).toHaveLength(1)

  await collections.pulls.remove(["team:acme/core:PR_node_1"])
  expect(database.rows(collections.canonical.pullRequests)).toHaveLength(1)
  expect(database.rows(collections.canonical.groupPulls).map(({ groupId }) => groupId)).toEqual([
    "org:acme",
  ])

  await actions.workflowRuns.upsert([
    {
      id: 99,
      repo: "acme/widget",
      workflowId: 9,
      name: "CI",
      displayTitle: "Normalize once",
      runNumber: 2,
      runAttempt: 1,
      event: "pull_request",
      status: "completed",
      conclusion: "success",
      headBranch: "feature/normalize",
      headSha: "head-1",
      actor: "alice",
      createdAt: "2026-09-29T10:00:00Z",
      updatedAt: "2026-09-29T10:20:00Z",
      url: "https://github.com/acme/widget/actions/runs/99",
    },
  ])
  expect(
    database
      .table<{ key: string; scope: string; id: number }>("workflowRuns")
      .collection.get(database.key("workflowRun", 99)),
  ).toMatchObject({ id: 99 })
  expect(collections.pullDetails.collection.get(detail.key)?.checks[0]?.workflowName).toBe("CI")

  const reopened = new NormalizedDatabase(sqlite.open())
  const reloaded = createPullCollections(reopened)
  await reopened.ready()
  expect(reopened.rows(reloaded.canonical.pullRequests)).toHaveLength(1)
  expect(reopened.rows(reloaded.canonical.groupPulls).map(({ groupId }) => groupId)).toEqual([
    "org:acme",
  ])
  expect(reopened.rows(reloaded.canonical.reviewComments)).toHaveLength(1)
  expect(reopened.rows(reloaded.canonical.files)).toHaveLength(1)

  await Promise.all(
    [
      ...Object.values(collections.canonical),
      collections.groups,
      collections.repos,
      collections.pulls,
      collections.pullDetails,
      collections.pullFiles,
      actions.workflows,
      actions.workflowRuns,
      actions.jobs,
      ...Object.values(reloaded.canonical),
      reloaded.groups,
      reloaded.repos,
      reloaded.pulls,
      reloaded.pullDetails,
      reloaded.pullFiles,
    ].map((collection) => collection.collection.cleanup()),
  )
})
