import "server-only";
import { compareSemver, type PolicyContent } from "@contextops/policy-schema";
import { northwind as d } from "@/server/demo/northwind";
import type {
  AuditItem,
  Billing,
  CurrentUser,
  FileState,
  ImportCandidate,
  Installation,
  Invitation,
  InviteDetail,
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
 * TEMPORARY demo implementation of the data layer, backed by the Northwind dataset that
 * also generates supabase/seed.sql. Replaced by Supabase queries when pages are wired up;
 * the exported signatures (see ./index.ts) stay the same.
 *
 * Repo status comes from `expectedStatus`, which is checked against the SQL
 * `repository_status` view, so this file does not re-implement the derivation.
 */

// ── Lookups ─────────────────────────────────────────────────────────────────────

const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
const versions = byId(d.policyVersions);
const policies = byId(d.policies);
const repos = byId(d.repositories);
const rollouts = byId(d.rollouts);

function person(userId: string | null): Person | null {
  if (!userId) return null;
  const p = d.profiles.find((x) => x.user_id === userId);
  return p
    ? {
        id: p.user_id,
        name: p.name ?? p.github_login ?? "Unknown",
        login: p.github_login,
        avatarUrl: p.avatar_url,
      }
    : null;
}

const semverOf = (versionId: string | null) =>
  versionId ? (versions.get(versionId)?.semver ?? null) : null;
const inWorkspace = <T extends { workspace_id: string }>(rows: T[], wsId: string) =>
  rows.filter((r) => r.workspace_id === wsId);

// ── Workspace & user ────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<CurrentUser> {
  const u = d.users.find((x) => x.id === d.currentUserId)!;
  return { ...person(u.id)!, email: u.email };
}

export async function listMyWorkspaces(): Promise<WorkspaceSummary[]> {
  return d.workspaceMembers
    .filter((m) => m.user_id === d.currentUserId)
    .map((m) => {
      const w = d.workspaces.find((x) => x.id === m.workspace_id)!;
      return { id: w.id, name: w.name, slug: w.slug, plan: w.plan, role: m.role };
    });
}

export async function getWorkspace(slug: string): Promise<Workspace | null> {
  const w = d.workspaces.find((x) => x.slug === slug);
  const m =
    w && d.workspaceMembers.find((x) => x.workspace_id === w.id && x.user_id === d.currentUserId);
  return w && m ? { ...w, role: m.role } : null;
}

// ── Repositories ────────────────────────────────────────────────────────────────

function repoItem(repoId: string): RepoListItem {
  const r = repos.get(repoId)!;
  const status = d.expectedStatus[repoId] as RepoStatus;
  const a = d.policyAssignments.find((x) => x.repository_id === repoId);
  const p = a ? policies.get(a.policy_id)! : null;
  const files = d.repoFileStates.filter((f) => f.repository_id === repoId);
  const applied = files.find((f) => f.applied_version_id)?.applied_version_id ?? null;
  const openPr = d.syncPullRequests
    .filter((x) => x.repository_id === repoId && x.state === "open")
    .at(-1);
  const lastItem = d.rolloutItems
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
    appliedVersion: semverOf(applied),
    expectedVersion: a ? semverOf(a.pinned_version_id ?? p!.current_version_id) : null,
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

export async function listRepositories(wsId: string): Promise<RepoListItem[]> {
  return inWorkspace(d.repositories, wsId)
    .filter((r) => !r.archived)
    .map((r) => repoItem(r.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getRepository(wsId: string, repoId: string): Promise<RepoDetail | null> {
  const r = repos.get(repoId);
  if (!r || r.workspace_id !== wsId) return null;
  const item = repoItem(repoId);
  const inst = d.githubInstallations.find((i) => i.id === r.installation_id)!;
  const ex = d.repoExemptions.find((e) => e.repository_id === repoId && !e.revoked_at);
  const files: FileState[] = d.repoFileStates
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
      appliedVersion: semverOf(f.applied_version_id),
      driftDiff: f.drift_diff,
      checkedAt: f.checked_at,
    }));
  return {
    ...item,
    installation: { accountLogin: inst.account_login },
    variables: r.variables as Record<string, string>,
    files,
    pullRequests: d.syncPullRequests
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
      ? { reason: ex.reason, expiresAt: ex.expires_at, createdBy: person(ex.created_by) }
      : null,
    disconnectedAt: r.disconnected_at,
    activity: (await listAuditEvents(wsId)).filter((e) => e.subjectId === repoId).slice(0, 20),
  };
}

// ── Policies ────────────────────────────────────────────────────────────────────

function policyItem(policyId: string, items: RepoListItem[]): PolicyListItem {
  const p = policies.get(policyId)!;
  const current = p.current_version_id ? versions.get(p.current_version_id)! : null;
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

export async function listPolicies(wsId: string): Promise<PolicyListItem[]> {
  const items = await listRepositories(wsId);
  return inWorkspace(d.policies, wsId)
    .map((p) => policyItem(p.id, items))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPolicy(wsId: string, policyId: string): Promise<PolicyDetail | null> {
  const p = policies.get(policyId);
  if (!p || p.workspace_id !== wsId) return null;
  const items = await listRepositories(wsId);
  const base = policyItem(policyId, items);
  const assignments = items.filter((r) => r.policy?.id === policyId);
  return {
    ...base,
    content: p.current_version_id
      ? (versions.get(p.current_version_id)!.content as PolicyContent)
      : null,
    draft: p.draft as PolicyContent | null,
    versions: d.policyVersions
      .filter((v) => v.policy_id === policyId)
      .sort((a, b) => compareSemver(b.semver, a.semver))
      .map((v) => ({
        id: v.id,
        semver: v.semver,
        changelog: v.changelog,
        publishedAt: v.published_at,
        publishedBy: person(v.published_by),
        repoCount: assignments.filter((r) => r.appliedVersion === v.semver).length,
      })),
    assignments,
  };
}

// ── Rollouts ────────────────────────────────────────────────────────────────────

function rolloutItem(rolloutId: string): RolloutListItem {
  const r = rollouts.get(rolloutId)!;
  const v = versions.get(r.policy_version_id)!;
  const p = policies.get(v.policy_id)!;
  const items = d.rolloutItems.filter((i) => i.rollout_id === rolloutId);
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
    createdBy: person(r.created_by),
    startedAt: r.started_at,
    finishedAt: r.finished_at,
  };
}

export async function listRollouts(wsId: string): Promise<RolloutListItem[]> {
  return inWorkspace(d.rollouts, wsId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => rolloutItem(r.id));
}

export async function getRollout(wsId: string, rolloutId: string): Promise<RolloutDetail | null> {
  const r = rollouts.get(rolloutId);
  if (!r || r.workspace_id !== wsId) return null;
  return {
    ...rolloutItem(rolloutId),
    items: d.rolloutItems
      .filter((i) => i.rollout_id === rolloutId)
      .map((i) => ({
        id: i.id,
        repo: { id: i.repository_id, fullName: repos.get(i.repository_id)!.full_name },
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

export async function listAuditEvents(wsId: string): Promise<AuditItem[]> {
  return inWorkspace(d.auditEvents, wsId)
    .map((e) => ({
      id: e.id,
      action: e.action,
      actorType: e.actor_type,
      actor: person(e.actor_id),
      subjectType: e.subject_type,
      subjectId: e.subject_id,
      metadata: e.metadata as Record<string, unknown>,
      createdAt: e.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listMembers(wsId: string): Promise<Member[]> {
  const order = ["owner", "admin", "editor", "viewer"];
  return inWorkspace(d.workspaceMembers, wsId)
    .map((m) => ({
      id: m.id,
      role: m.role,
      person: person(m.user_id)!,
      email: d.users.find((u) => u.id === m.user_id)!.email,
      joinedAt: m.created_at,
    }))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
}

export async function listInvitations(wsId: string): Promise<Invitation[]> {
  return inWorkspace(d.invitations, wsId)
    .filter((i) => !i.accepted_at)
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: person(i.invited_by),
      expiresAt: i.expires_at,
    }));
}

export async function listInstallations(wsId: string): Promise<Installation[]> {
  return inWorkspace(d.githubInstallations, wsId).map((i) => ({
    id: i.id,
    accountLogin: i.account_login,
    accountType: i.account_type,
    repoSelection: i.repo_selection,
    repoCount: d.repositories.filter((r) => r.installation_id === i.id && !r.disconnected_at)
      .length,
    connectedAt: i.created_at,
    state: i.uninstalled_at ? "uninstalled" : i.suspended_at ? "suspended" : "active",
  }));
}

export async function getBilling(wsId: string): Promise<Billing> {
  const w = d.workspaces.find((x) => x.id === wsId)!;
  const installs = await listInstallations(wsId);
  return {
    plan: w.plan,
    usage: {
      repos: installs.reduce((n, i) => n + i.repoCount, 0),
      orgs: installs.filter((i) => i.state === "active").length,
      members: inWorkspace(d.workspaceMembers, wsId).length,
    },
  };
}

export async function getInvite(token: string): Promise<InviteDetail | null> {
  // Phase 2 looks the token up by its hash. The demo shows the pending Harbor invite for any token.
  if (!token) return null;
  const i = d.invitations[0]!;
  const w = d.workspaces.find((x) => x.id === i.workspace_id)!;
  return {
    workspaceName: w.name,
    role: i.role,
    invitedBy: person(i.invited_by),
    email: i.email,
    expiresAt: i.expires_at,
  };
}

// ── Overview & search ───────────────────────────────────────────────────────────

export async function getOverview(wsId: string): Promise<Overview> {
  const items = await listRepositories(wsId);
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
  for (const p of inWorkspace(d.policies, wsId)) {
    const current = semverOf(p.current_version_id);
    if (!current) continue;
    const behind = items.filter(
      (r) =>
        r.policy?.id === p.id &&
        (r.status === "compliant" || r.status === "drifted") &&
        r.appliedVersion &&
        compareSemver(r.appliedVersion, current) < 0 &&
        d.policyAssignments.find((a) => a.repository_id === r.id)?.track_latest,
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

  const activity = (await listAuditEvents(wsId)).filter((e) => e.action !== "drift_scan.completed");
  return {
    counts,
    total: items.length,
    attention: items.filter((r) => r.status === "drifted" || r.status === "sync_failed"),
    suggestions,
    recentRollouts: (await listRollouts(wsId)).slice(0, 4),
    activity: activity.slice(0, 8),
    setup: {
      connected: inWorkspace(d.githubInstallations, wsId).length > 0,
      policyPublished: inWorkspace(d.policyVersions, wsId).length > 0,
      assigned: inWorkspace(d.policyAssignments, wsId).length > 0,
      firstPrMerged: inWorkspace(d.syncPullRequests, wsId).some((p) => p.state === "merged"),
    },
  };
}

export async function getSearchIndex(wsId: string): Promise<SearchIndex> {
  return {
    repos: (await listRepositories(wsId)).map((r) => ({
      id: r.id,
      fullName: r.fullName,
      status: r.status,
    })),
    policies: inWorkspace(d.policies, wsId).map((p) => ({ id: p.id, name: p.name })),
  };
}

// ── Authoring helpers ───────────────────────────────────────────────────────────

/** Existing agent files without a managed block: candidates for "Import from a repo". */
export async function listImportCandidates(wsId: string): Promise<ImportCandidate[]> {
  return inWorkspace(d.repoFileStates, wsId)
    .filter((f) => f.blob_sha && !f.managed_hash)
    .map((f) => ({
      repoId: f.repository_id,
      fullName: repos.get(f.repository_id)!.full_name,
      path: f.path,
      target: f.target,
    }));
}

export async function listPolicyVersionOptions(wsId: string): Promise<PolicyVersionOption[]> {
  return inWorkspace(d.policies, wsId)
    .map((p) => ({
      policy: { id: p.id, name: p.name },
      versions: d.policyVersions
        .filter((v) => v.policy_id === p.id)
        .sort((a, b) => compareSemver(b.semver, a.semver))
        .map((v) => ({ id: v.id, semver: v.semver })),
      targets: d.policyAssignments.find((a) => a.policy_id === p.id)?.targets ?? [
        "agents",
        "claude",
        "copilot",
      ],
    }))
    .sort((a, b) => a.policy.name.localeCompare(b.policy.name));
}
