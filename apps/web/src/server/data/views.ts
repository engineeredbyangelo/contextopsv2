import { compareSemver, type PolicyContent } from "@contextops/policy-schema";
import type { Tables } from "@/server/supabase/database.types";
import type {
  AuditItem,
  Billing,
  CurrentUser,
  FileState,
  ImportCandidate,
  Installation,
  Invitation,
  Member,
  Overview,
  Person,
  PolicyDetail,
  PolicyListItem,
  PolicyVersionOption,
  RepoDetail,
  RepoListItem,
  RepoStatus,
  RolloutCounts,
  RolloutDetail,
  RolloutListItem,
  RolloutSuggestion,
  SearchIndex,
  Workspace,
  WorkspaceSummary,
} from "./types";

/**
 * View models for every page, built from one tenant dataset: the rows the signed-in user
 * can see (RLS-scoped in Supabase; see ./supabase.ts). Pure, so it's unit-tested against
 * the Northwind dataset.
 *
 * Repo status is never derived here: it comes from the SQL `repository_status` view.
 */

export type Dataset = {
  currentUserId: string;
  /** Emails of people in the user's workspaces (auth.users isn't readable directly). */
  users: { id: string; email: string }[];
  profiles: Tables<"profiles">[];
  workspaces: Tables<"workspaces">[];
  workspaceMembers: Tables<"workspace_members">[];
  invitations: Tables<"invitations">[];
  githubInstallations: Tables<"github_installations">[];
  repositories: Tables<"repositories">[];
  policies: Tables<"policies">[];
  policyVersions: Tables<"policy_versions">[];
  policyAssignments: Tables<"policy_assignments">[];
  repoExemptions: Tables<"repo_exemptions">[];
  repoFileStates: Tables<"repo_file_states">[];
  rollouts: Tables<"rollouts">[];
  rolloutItems: Tables<"rollout_items">[];
  syncPullRequests: Tables<"sync_pull_requests">[];
  auditEvents: Tables<"audit_events">[];
  /** repository_id → status from the repository_status view. */
  status: Record<string, RepoStatus>;
};

const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));

/** Builds the data-layer functions over a dataset loader (called once per function call). */
export function createDataLayer(load: () => Promise<Dataset>) {
  const indexes = new WeakMap<Dataset, Ctx>();
  function index(d: Dataset): Ctx {
    return {
      d,
      versions: byId(d.policyVersions),
      policies: byId(d.policies),
      repos: byId(d.repositories),
      rollouts: byId(d.rollouts),
    };
  }
  async function ctx() {
    const d = await load();
    let i = indexes.get(d);
    if (!i) indexes.set(d, (i = index(d)));
    return i;
  }

  return {
    getCurrentUser: async () => getCurrentUser(await ctx()),
    listMyWorkspaces: async () => listMyWorkspaces(await ctx()),
    getWorkspace: async (slug: string) => getWorkspace(await ctx(), slug),
    listRepositories: async (wsId: string) => listRepositories(await ctx(), wsId),
    getRepository: async (wsId: string, repoId: string) => getRepository(await ctx(), wsId, repoId),
    listPolicies: async (wsId: string) => listPolicies(await ctx(), wsId),
    getPolicy: async (wsId: string, policyId: string) => getPolicy(await ctx(), wsId, policyId),
    listRollouts: async (wsId: string) => listRollouts(await ctx(), wsId),
    getRollout: async (wsId: string, rolloutId: string) => getRollout(await ctx(), wsId, rolloutId),
    listAuditEvents: async (wsId: string) => listAuditEvents(await ctx(), wsId),
    listMembers: async (wsId: string) => listMembers(await ctx(), wsId),
    listInvitations: async (wsId: string) => listInvitations(await ctx(), wsId),
    listInstallations: async (wsId: string) => listInstallations(await ctx(), wsId),
    getBilling: async (wsId: string) => getBilling(await ctx(), wsId),
    getOverview: async (wsId: string) => getOverview(await ctx(), wsId),
    getSearchIndex: async (wsId: string) => getSearchIndex(await ctx(), wsId),
    listImportCandidates: async (wsId: string) => listImportCandidates(await ctx(), wsId),
    listPolicyVersionOptions: async (wsId: string) => listPolicyVersionOptions(await ctx(), wsId),
  };
}

type Ctx = {
  d: Dataset;
  versions: Map<string, Tables<"policy_versions">>;
  policies: Map<string, Tables<"policies">>;
  repos: Map<string, Tables<"repositories">>;
  rollouts: Map<string, Tables<"rollouts">>;
};

// ── Lookups ─────────────────────────────────────────────────────────────────────

function person(c: Ctx, userId: string | null): Person | null {
  if (!userId) return null;
  const p = c.d.profiles.find((x) => x.user_id === userId);
  return p
    ? {
        id: p.user_id,
        name: p.name ?? p.github_login ?? "Unknown",
        login: p.github_login,
        avatarUrl: p.avatar_url,
      }
    : null;
}

const semverOf = (c: Ctx, versionId: string | null) =>
  versionId ? (c.versions.get(versionId)?.semver ?? null) : null;
const inWorkspace = <T extends { workspace_id: string }>(rows: T[], wsId: string) =>
  rows.filter((r) => r.workspace_id === wsId);

// ── Workspace & user ────────────────────────────────────────────────────────────

async function getCurrentUser(c: Ctx): Promise<CurrentUser> {
  const u = c.d.users.find((x) => x.id === c.d.currentUserId)!;
  return { ...person(c, u.id)!, email: u.email };
}

async function listMyWorkspaces(c: Ctx): Promise<WorkspaceSummary[]> {
  return c.d.workspaceMembers
    .filter((m) => m.user_id === c.d.currentUserId)
    .map((m) => {
      const w = c.d.workspaces.find((x) => x.id === m.workspace_id)!;
      return { id: w.id, name: w.name, slug: w.slug, plan: w.plan, role: m.role };
    });
}

async function getWorkspace(c: Ctx, slug: string): Promise<Workspace | null> {
  const w = c.d.workspaces.find((x) => x.slug === slug);
  const m =
    w &&
    c.d.workspaceMembers.find((x) => x.workspace_id === w.id && x.user_id === c.d.currentUserId);
  return w && m ? { ...w, role: m.role } : null;
}

// ── Repositories ────────────────────────────────────────────────────────────────

function repoItem(c: Ctx, repoId: string): RepoListItem {
  const r = c.repos.get(repoId)!;
  const status = c.d.status[repoId]!;
  const a = c.d.policyAssignments.find((x) => x.repository_id === repoId);
  const p = a ? c.policies.get(a.policy_id)! : null;
  const files = c.d.repoFileStates.filter((f) => f.repository_id === repoId);
  const applied = files.find((f) => f.applied_version_id)?.applied_version_id ?? null;
  const openPr = c.d.syncPullRequests
    .filter((x) => x.repository_id === repoId && x.state === "open")
    .at(-1);
  const lastItem = c.d.rolloutItems
    .filter((x) => x.repository_id === repoId)
    .sort((x, y) => x.created_at.localeCompare(y.created_at))
    .at(-1);
  return {
    id: r.id,
    name: r.name,
    owner: r.owner_login,
    fullName: r.full_name,
    visibility: r.visibility,
    language: r.primary_language,
    defaultBranch: r.default_branch,
    status,
    policy: p ? { id: p.id, name: p.name } : null,
    appliedVersion: semverOf(c, applied),
    expectedVersion: a ? semverOf(c, a.pinned_version_id ?? p!.current_version_id) : null,
    targets: a?.targets ?? [],
    checkedAt:
      files
        .map((f) => f.checked_at)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
    openPr: openPr ? { number: openPr.pr_number, url: openPr.pr_url } : null,
    error:
      status === "sync_failed" && lastItem?.error_code
        ? { code: lastItem.error_code, message: lastItem.error_message ?? "" }
        : null,
  };
}

async function listRepositories(c: Ctx, wsId: string): Promise<RepoListItem[]> {
  return inWorkspace(c.d.repositories, wsId)
    .filter((r) => !r.archived)
    .map((r) => repoItem(c, r.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

async function getRepository(c: Ctx, wsId: string, repoId: string): Promise<RepoDetail | null> {
  const r = c.repos.get(repoId);
  // Archived repos are hidden everywhere (and absent from repository_status).
  if (!r || r.workspace_id !== wsId || r.archived) return null;
  const item = repoItem(c, repoId);
  const inst = c.d.githubInstallations.find((i) => i.id === r.installation_id)!;
  const ex = c.d.repoExemptions.find((e) => e.repository_id === repoId && !e.revoked_at);
  const files: FileState[] = c.d.repoFileStates
    .filter((f) => f.repository_id === repoId)
    .map((f) => ({
      target: f.target,
      path: f.path,
      state: !f.blob_sha
        ? "missing"
        : !f.managed_hash
          ? "unmanaged"
          : f.managed_hash === f.expected_hash
            ? "in_sync"
            : "drifted",
      appliedVersion: semverOf(c, f.applied_version_id),
      driftDiff: f.drift_diff,
      checkedAt: f.checked_at,
    }));
  return {
    ...item,
    installation: { accountLogin: inst.account_login },
    variables: r.variables as Record<string, string>,
    files,
    pullRequests: c.d.syncPullRequests
      .filter((p) => p.repository_id === repoId)
      .map((p) => ({
        id: p.id,
        number: p.pr_number,
        url: p.pr_url,
        title: p.title,
        state: p.state,
        openedAt: p.opened_at,
        mergedAt: p.merged_at,
      }))
      .reverse(),
    exemption: ex
      ? { reason: ex.reason, expiresAt: ex.expires_at, createdBy: person(c, ex.created_by) }
      : null,
    disconnectedAt: r.disconnected_at,
    activity: (await listAuditEvents(c, wsId)).filter((e) => e.subjectId === repoId).slice(0, 20),
  };
}

// ── Policies ────────────────────────────────────────────────────────────────────

function policyItem(c: Ctx, policyId: string, items: RepoListItem[]): PolicyListItem {
  const p = c.policies.get(policyId)!;
  const current = p.current_version_id ? c.versions.get(p.current_version_id)! : null;
  const assigned = items.filter((r) => r.policy?.id === policyId);
  const inUse = new Map<string, number>();
  for (const r of assigned)
    if (r.appliedVersion) inUse.set(r.appliedVersion, (inUse.get(r.appliedVersion) ?? 0) + 1);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    currentVersion: current
      ? { id: current.id, semver: current.semver, publishedAt: current.published_at }
      : null,
    hasDraft: p.draft !== null,
    repoCount: assigned.length,
    versionsInUse: [...inUse]
      .map(([semver, count]) => ({ semver, count }))
      .sort((a, b) => compareSemver(b.semver, a.semver)),
    updatedAt: p.updated_at,
  };
}

async function listPolicies(c: Ctx, wsId: string): Promise<PolicyListItem[]> {
  const items = await listRepositories(c, wsId);
  return inWorkspace(c.d.policies, wsId)
    .map((p) => policyItem(c, p.id, items))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getPolicy(c: Ctx, wsId: string, policyId: string): Promise<PolicyDetail | null> {
  const p = c.policies.get(policyId);
  if (!p || p.workspace_id !== wsId) return null;
  const items = await listRepositories(c, wsId);
  const base = policyItem(c, policyId, items);
  const assignments = items.filter((r) => r.policy?.id === policyId);
  return {
    ...base,
    content: p.current_version_id
      ? (c.versions.get(p.current_version_id)!.content as PolicyContent)
      : null,
    draft: p.draft as PolicyContent | null,
    versions: c.d.policyVersions
      .filter((v) => v.policy_id === policyId)
      .sort((a, b) => compareSemver(b.semver, a.semver))
      .map((v) => ({
        id: v.id,
        semver: v.semver,
        changelog: v.changelog,
        publishedAt: v.published_at,
        publishedBy: person(c, v.published_by),
        repoCount: assignments.filter((r) => r.appliedVersion === v.semver).length,
      })),
    assignments,
  };
}

// ── Rollouts ────────────────────────────────────────────────────────────────────

function rolloutItem(c: Ctx, rolloutId: string): RolloutListItem {
  const r = c.rollouts.get(rolloutId)!;
  const v = c.versions.get(r.policy_version_id)!;
  const p = c.policies.get(v.policy_id)!;
  const items = c.d.rolloutItems.filter((i) => i.rollout_id === rolloutId);
  const count = (...s: string[]) => items.filter((i) => s.includes(i.status)).length;
  const counts: RolloutCounts = {
    total: items.length,
    merged: count("merged"),
    prOpen: count("pr_open"),
    upToDate: count("up_to_date"),
    failed: count("failed"),
    skipped: count("skipped", "closed"),
    inProgress: count("queued", "running"),
  };
  return {
    id: r.id,
    policy: { id: p.id, name: p.name },
    semver: v.semver,
    status: r.status,
    targets: r.targets,
    counts,
    createdBy: person(c, r.created_by),
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

async function listRollouts(c: Ctx, wsId: string): Promise<RolloutListItem[]> {
  return inWorkspace(c.d.rollouts, wsId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => rolloutItem(c, r.id));
}

async function getRollout(c: Ctx, wsId: string, rolloutId: string): Promise<RolloutDetail | null> {
  const r = c.rollouts.get(rolloutId);
  if (!r || r.workspace_id !== wsId) return null;
  return {
    ...rolloutItem(c, rolloutId),
    items: c.d.rolloutItems
      .filter((i) => i.rollout_id === rolloutId)
      .map((i) => ({
        id: i.id,
        repo: { id: i.repository_id, fullName: c.repos.get(i.repository_id)!.full_name },
        status: i.status,
        branch: i.branch,
        prNumber: i.pr_number,
        prUrl: i.pr_url,
        errorCode: i.error_code,
        errorMessage: i.error_message,
        updatedAt: i.updated_at,
      }))
      .sort((a, b) => a.repo.fullName.localeCompare(b.repo.fullName)),
  };
}

// ── Audit, team, integrations, billing ──────────────────────────────────────────

async function listAuditEvents(c: Ctx, wsId: string): Promise<AuditItem[]> {
  return inWorkspace(c.d.auditEvents, wsId)
    .map((e) => ({
      id: e.id,
      action: e.action,
      actorType: e.actor_type,
      actor: person(c, e.actor_id),
      subjectType: e.subject_type,
      subjectId: e.subject_id,
      metadata: e.metadata as Record<string, unknown>,
      createdAt: e.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function listMembers(c: Ctx, wsId: string): Promise<Member[]> {
  const order = ["owner", "admin", "editor", "viewer"];
  return inWorkspace(c.d.workspaceMembers, wsId)
    .map((m) => ({
      id: m.id,
      role: m.role,
      person: person(c, m.user_id)!,
      email: c.d.users.find((u) => u.id === m.user_id)!.email,
      joinedAt: m.created_at,
    }))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
}

async function listInvitations(c: Ctx, wsId: string): Promise<Invitation[]> {
  return inWorkspace(c.d.invitations, wsId)
    .filter((i) => !i.accepted_at)
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: person(c, i.invited_by),
      expiresAt: i.expires_at,
    }));
}

async function listInstallations(c: Ctx, wsId: string): Promise<Installation[]> {
  return inWorkspace(c.d.githubInstallations, wsId).map((i) => ({
    id: i.id,
    accountLogin: i.account_login,
    accountType: i.account_type,
    repoSelection: i.repo_selection,
    repoCount: c.d.repositories.filter((r) => r.installation_id === i.id && !r.disconnected_at)
      .length,
    connectedAt: i.created_at,
    state: i.uninstalled_at ? "uninstalled" : i.suspended_at ? "suspended" : "active",
  }));
}

async function getBilling(c: Ctx, wsId: string): Promise<Billing> {
  const w = c.d.workspaces.find((x) => x.id === wsId)!;
  const installs = await listInstallations(c, wsId);
  return {
    plan: w.plan,
    usage: {
      repos: installs.reduce((n, i) => n + i.repoCount, 0),
      orgs: installs.filter((i) => i.state === "active").length,
      members: inWorkspace(c.d.workspaceMembers, wsId).length,
    },
  };
}

// ── Overview & search ───────────────────────────────────────────────────────────

async function getOverview(c: Ctx, wsId: string): Promise<Overview> {
  const items = await listRepositories(c, wsId);
  const counts = {
    compliant: 0,
    drifted: 0,
    pending_sync: 0,
    sync_failed: 0,
    exempted: 0,
    disconnected: 0,
    unassigned: 0,
  };
  for (const r of items) counts[r.status]++;

  const suggestions: RolloutSuggestion[] = [];
  for (const p of inWorkspace(c.d.policies, wsId)) {
    const current = semverOf(c, p.current_version_id);
    if (!current) continue;
    const behind = items.filter(
      (r) =>
        r.policy?.id === p.id &&
        (r.status === "compliant" || r.status === "drifted") &&
        r.appliedVersion &&
        compareSemver(r.appliedVersion, current) < 0 &&
        c.d.policyAssignments.find((a) => a.repository_id === r.id)?.track_latest,
    );
    const versionsBehind = [...new Set(behind.map((r) => r.appliedVersion!))].sort(compareSemver);
    if (behind.length) {
      suggestions.push({
        policy: { id: p.id, name: p.name },
        currentVersion: current,
        behindVersion: versionsBehind[0]!,
        repoCount: behind.length,
      });
    }
  }

  const activity = (await listAuditEvents(c, wsId)).filter(
    (e) => e.action !== "drift_scan.completed",
  );
  return {
    counts,
    total: items.length,
    attention: items.filter((r) => r.status === "drifted" || r.status === "sync_failed"),
    suggestions,
    recentRollouts: (await listRollouts(c, wsId)).slice(0, 4),
    activity: activity.slice(0, 8),
    setup: {
      connected: inWorkspace(c.d.githubInstallations, wsId).length > 0,
      policyPublished: inWorkspace(c.d.policyVersions, wsId).length > 0,
      assigned: inWorkspace(c.d.policyAssignments, wsId).length > 0,
      firstPrMerged: inWorkspace(c.d.syncPullRequests, wsId).some((p) => p.state === "merged"),
    },
  };
}

async function getSearchIndex(c: Ctx, wsId: string): Promise<SearchIndex> {
  return {
    repos: (await listRepositories(c, wsId)).map((r) => ({
      id: r.id,
      fullName: r.fullName,
      status: r.status,
    })),
    policies: inWorkspace(c.d.policies, wsId).map((p) => ({ id: p.id, name: p.name })),
  };
}

// ── Authoring helpers ───────────────────────────────────────────────────────────

/** Existing agent files without a managed block: candidates for "Import from a repo". */
async function listImportCandidates(c: Ctx, wsId: string): Promise<ImportCandidate[]> {
  return inWorkspace(c.d.repoFileStates, wsId)
    .filter((f) => f.blob_sha && !f.managed_hash)
    .map((f) => ({
      repoId: f.repository_id,
      fullName: c.repos.get(f.repository_id)!.full_name,
      path: f.path,
      target: f.target,
    }));
}

async function listPolicyVersionOptions(c: Ctx, wsId: string): Promise<PolicyVersionOption[]> {
  return inWorkspace(c.d.policies, wsId)
    .map((p) => ({
      policy: { id: p.id, name: p.name },
      versions: c.d.policyVersions
        .filter((v) => v.policy_id === p.id)
        .sort((a, b) => compareSemver(b.semver, a.semver))
        .map((v) => ({ id: v.id, semver: v.semver })),
      targets: c.d.policyAssignments.find((a) => a.policy_id === p.id)?.targets ?? [
        "agents",
        "claude",
        "copilot",
      ],
    }))
    .sort((a, b) => a.policy.name.localeCompare(b.policy.name));
}
