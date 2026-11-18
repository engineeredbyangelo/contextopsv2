import type { PolicyContent } from "@contextops/policy-schema";
import type { Enums, Tables } from "@/server/supabase/database.types";

/** View models returned by the data layer. Stable across the demo and Supabase implementations. */

export type Role = Enums<"workspace_role">;
export type RepoStatus = Enums<"repository_compliance">;
export type RolloutStatus = Enums<"rollout_status">;
export type RolloutItemStatus = Enums<"rollout_item_status">;

export type Person = { id: string; name: string; login: string | null; avatarUrl: string | null };

export type CurrentUser = Person & { email: string };

export type WorkspaceSummary = Pick<Tables<"workspaces">, "id" | "name" | "slug" | "plan"> & {
  role: Role;
};

export type Workspace = Tables<"workspaces"> & { role: Role };

export type RepoListItem = {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  visibility: Enums<"repo_visibility">;
  language: string | null;
  defaultBranch: string;
  status: RepoStatus;
  policy: { id: string; name: string } | null;
  appliedVersion: string | null;
  expectedVersion: string | null;
  targets: string[];
  checkedAt: string | null;
  openPr: { number: number; url: string } | null;
  error: { code: string; message: string } | null;
};

export type FileState = {
  target: string;
  path: string;
  state: "in_sync" | "drifted" | "missing" | "unmanaged";
  appliedVersion: string | null;
  driftDiff: string | null;
  checkedAt: string | null;
};

export type PullRequest = {
  id: string;
  number: number;
  url: string;
  title: string;
  state: Enums<"pull_request_state">;
  openedAt: string;
  mergedAt: string | null;
};

export type AuditItem = {
  id: string;
  action: string;
  actorType: Enums<"actor_type">;
  actor: Person | null;
  subjectType: string;
  subjectId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type RepoDetail = RepoListItem & {
  installation: { accountLogin: string };
  variables: Record<string, string>;
  files: FileState[];
  pullRequests: PullRequest[];
  exemption: { reason: string; expiresAt: string | null; createdBy: Person | null } | null;
  disconnectedAt: string | null;
  activity: AuditItem[];
};

export type PolicyVersionSummary = {
  id: string;
  semver: string;
  changelog: string;
  publishedAt: string;
  publishedBy: Person | null;
  repoCount: number;
};

export type PolicyListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currentVersion: { id: string; semver: string; publishedAt: string } | null;
  hasDraft: boolean;
  repoCount: number;
  versionsInUse: { semver: string; count: number }[];
  updatedAt: string;
};

export type PolicyDetail = PolicyListItem & {
  content: PolicyContent | null;
  draft: PolicyContent | null;
  versions: PolicyVersionSummary[];
  assignments: RepoListItem[];
};

export type RolloutCounts = {
  total: number;
  merged: number;
  prOpen: number;
  upToDate: number;
  failed: number;
  skipped: number;
  inProgress: number;
};

export type RolloutListItem = {
  id: string;
  policy: { id: string; name: string };
  semver: string;
  status: RolloutStatus;
  targets: string[];
  counts: RolloutCounts;
  createdBy: Person | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type RolloutItem = {
  id: string;
  repo: { id: string; fullName: string };
  status: RolloutItemStatus;
  branch: string | null;
  prNumber: number | null;
  prUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: string;
};

export type RolloutDetail = RolloutListItem & { items: RolloutItem[] };

export type Member = { id: string; role: Role; person: Person; email: string; joinedAt: string };

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  invitedBy: Person | null;
  expiresAt: string;
};

export type Installation = {
  id: string;
  accountLogin: string;
  accountType: Enums<"github_account_type">;
  repoSelection: Enums<"repo_selection">;
  repoCount: number;
  connectedAt: string;
  state: "active" | "suspended" | "uninstalled";
};

export type RolloutSuggestion = {
  policy: { id: string; name: string };
  currentVersion: string;
  behindVersion: string;
  repoCount: number;
};

export type Overview = {
  counts: Record<RepoStatus, number>;
  total: number;
  attention: RepoListItem[];
  suggestions: RolloutSuggestion[];
  recentRollouts: RolloutListItem[];
  activity: AuditItem[];
  setup: {
    connected: boolean;
    policyPublished: boolean;
    assigned: boolean;
    firstPrMerged: boolean;
  };
};

export type Billing = {
  plan: Enums<"workspace_plan">;
  usage: { repos: number; orgs: number; members: number };
};

export type InviteDetail = {
  workspaceName: string;
  role: Role;
  invitedBy: Person | null;
  email: string;
  expiresAt: string;
};

export type SearchIndex = {
  repos: { id: string; fullName: string; status: RepoStatus }[];
  policies: { id: string; name: string }[];
};

export type ImportCandidate = { repoId: string; fullName: string; path: string; target: string };

export type PolicyVersionOption = {
  policy: { id: string; name: string };
  versions: { id: string; semver: string }[];
  targets: string[];
};
