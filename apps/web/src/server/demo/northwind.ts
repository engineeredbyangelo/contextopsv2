import { createHash } from "node:crypto";
import { policyContentSchema, TARGETS, type TargetId } from "@contextops/policy-schema";
import type { Tables } from "@/server/supabase/database.types";
import { DRIFT_DIFFS, POLICY_CONTENT } from "./content";

/**
 * Northwind Labs demo workspace: 24 repos across 2 GitHub orgs, 3 policies,
 * 6 rollouts and 200 audit events.
 *
 * This single dataset generates supabase/seed.sql (`pnpm db:seed:generate`) and backs
 * the demo data layer until pages read from Supabase, so the two never disagree.
 * Fully deterministic: fixed ids, fixed timestamps, no randomness.
 */

// ── Deterministic ids and time ──────────────────────────────────────────────────

const NS = {
  user: 1,
  workspace: 2,
  member: 3,
  invitation: 4,
  installation: 5,
  repo: 6,
  policy: 7,
  version: 8,
  assignment: 9,
  exemption: 10,
  fileState: 11,
  rollout: 12,
  item: 13,
  pr: 14,
  audit: 15,
} as const;

function uid(ns: number, n: number): string {
  return `${ns.toString(16).padStart(8, "0")}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

/** ISO timestamp for a date in 2026 at a given hour (UTC). */
function at(date: string, hour = 15, minute = 0): string {
  return new Date(
    `2026-${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
  ).toISOString();
}

function sha(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function gitSha(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

// ── People and workspace ────────────────────────────────────────────────────────

type Person = {
  key: string;
  name: string;
  login: string;
  email: string;
  role: Tables<"workspace_members">["role"];
  joined: string;
};

const PEOPLE: Person[] = [
  {
    key: "maya",
    name: "Maya Okafor",
    login: "mokafor",
    email: "maya@northwind.example",
    role: "owner",
    joined: "08-01",
  },
  {
    key: "daniel",
    name: "Daniel Reyes",
    login: "dreyes",
    email: "daniel@northwind.example",
    role: "admin",
    joined: "08-03",
  },
  {
    key: "priya",
    name: "Priya Natarajan",
    login: "pnatarajan",
    email: "priya@northwind.example",
    role: "editor",
    joined: "08-10",
  },
  {
    key: "sam",
    name: "Sam Whitfield",
    login: "swhitfield",
    email: "sam@harbor-analytics.example",
    role: "viewer",
    joined: "09-02",
  },
];

const userId = (key: string) => uid(NS.user, PEOPLE.findIndex((p) => p.key === key) + 1);

export const WORKSPACE_ID = uid(NS.workspace, 1);

const workspace: Tables<"workspaces"> = {
  id: WORKSPACE_ID,
  name: "Northwind Labs",
  slug: "northwind-labs",
  plan: "agency",
  stripe_customer_id: null,
  settings: {
    audience: "clients",
    requirePublishApproval: false,
    rolloutsByEditors: "with_approval",
  },
  created_at: at("08-01", 14),
  updated_at: at("08-01", 14),
};

const profiles: Tables<"profiles">[] = PEOPLE.map((p) => ({
  user_id: userId(p.key),
  github_login: p.login,
  name: p.name,
  avatar_url: null,
  created_at: at(p.joined, 14),
  updated_at: at(p.joined, 14),
}));

const members: Tables<"workspace_members">[] = PEOPLE.map((p, i) => ({
  id: uid(NS.member, i + 1),
  workspace_id: WORKSPACE_ID,
  user_id: userId(p.key),
  role: p.role,
  created_at: at(p.joined, 14, 5),
  updated_at: at(p.joined, 14, 5),
}));

const invitations: Tables<"invitations">[] = [
  {
    id: uid(NS.invitation, 1),
    workspace_id: WORKSPACE_ID,
    email: "lena@harbor-analytics.example",
    role: "viewer",
    token_hash: sha("demo-invite-lena"),
    invited_by: userId("daniel"),
    expires_at: at("11-20", 10),
    accepted_at: null,
    created_at: at("11-13", 10),
    updated_at: at("11-13", 10),
  },
];

// ── GitHub ──────────────────────────────────────────────────────────────────────

const ORGS = [
  { login: "northwind-labs", installationId: 51_000_001, selection: "all", connected: "08-01" },
  {
    login: "harbor-analytics",
    installationId: 51_000_002,
    selection: "selected",
    connected: "09-01",
  },
] as const;

type OrgLogin = (typeof ORGS)[number]["login"];
const installationUuid = (login: OrgLogin) =>
  uid(NS.installation, ORGS.findIndex((o) => o.login === login) + 1);

const installations: Tables<"github_installations">[] = ORGS.map((o, i) => ({
  id: uid(NS.installation, i + 1),
  workspace_id: WORKSPACE_ID,
  installation_id: o.installationId,
  account_login: o.login,
  account_type: "organization",
  repo_selection: o.selection,
  suspended_at: null,
  uninstalled_at: null,
  created_at: at(o.connected, 14, 10),
  updated_at: at(o.connected, 14, 10),
}));

type PolicySlug = keyof typeof POLICY_CONTENT;
type DemoStatus =
  | "compliant"
  | "drifted"
  | "pending_sync"
  | "sync_failed"
  | "exempted"
  | "unassigned"
  | "disconnected";

type RepoSpec = {
  name: string;
  org: OrgLogin;
  language: string;
  visibility: "public" | "private";
  policy: PolicySlug | null;
  /** The status this repo should derive to; history below is built to produce it. */
  status: DemoStatus;
  drifted?: TargetId;
  vars: Record<string, string>;
};

const pnpm = { packageManager: "pnpm", nodeVersion: "22" };
const npm = { packageManager: "npm", nodeVersion: "22" };
const uv = { packageManager: "uv", pythonVersion: "3.13" };

const REPOS: RepoSpec[] = [
  {
    name: "web-app",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "nextjs-supabase",
    status: "compliant",
    vars: pnpm,
  },
  {
    name: "marketing-site",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "public",
    policy: "nextjs-supabase",
    status: "compliant",
    vars: pnpm,
  },
  {
    name: "design-system",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "public",
    policy: "core-standards",
    status: "compliant",
    vars: pnpm,
  },
  {
    name: "api-gateway",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "core-standards",
    status: "compliant",
    vars: npm,
  },
  {
    name: "billing-service",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "core-standards",
    status: "drifted",
    drifted: "claude",
    vars: pnpm,
  },
  {
    name: "notifications-service",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "core-standards",
    status: "compliant",
    vars: npm,
  },
  {
    name: "internal-tools",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "nextjs-supabase",
    status: "compliant",
    vars: pnpm,
  },
  {
    name: "mobile-app",
    org: "northwind-labs",
    language: "TypeScript",
    visibility: "private",
    policy: "core-standards",
    status: "sync_failed",
    vars: npm,
  },
  {
    name: "data-pipeline",
    org: "northwind-labs",
    language: "Python",
    visibility: "private",
    policy: "python-service",
    status: "compliant",
    vars: uv,
  },
  {
    name: "ml-models",
    org: "northwind-labs",
    language: "Python",
    visibility: "private",
    policy: "python-service",
    status: "drifted",
    drifted: "agents",
    vars: uv,
  },
  {
    name: "search-indexer",
    org: "northwind-labs",
    language: "Python",
    visibility: "private",
    policy: "python-service",
    status: "compliant",
    vars: uv,
  },
  {
    name: "auth-service",
    org: "northwind-labs",
    language: "Go",
    visibility: "private",
    policy: "core-standards",
    status: "compliant",
    vars: { packageManager: "go" },
  },
  {
    name: "infra-terraform",
    org: "northwind-labs",
    language: "HCL",
    visibility: "private",
    policy: "core-standards",
    status: "exempted",
    vars: {},
  },
  {
    name: "docs",
    org: "northwind-labs",
    language: "MDX",
    visibility: "public",
    policy: null,
    status: "unassigned",
    vars: pnpm,
  },
  {
    name: "legacy-admin",
    org: "northwind-labs",
    language: "JavaScript",
    visibility: "private",
    policy: "core-standards",
    status: "disconnected",
    vars: npm,
  },
  {
    name: "harbor-web",
    org: "harbor-analytics",
    language: "TypeScript",
    visibility: "private",
    policy: "nextjs-supabase",
    status: "compliant",
    vars: pnpm,
  },
  {
    name: "harbor-dashboard",
    org: "harbor-analytics",
    language: "TypeScript",
    visibility: "private",
    policy: "nextjs-supabase",
    status: "drifted",
    drifted: "copilot",
    vars: pnpm,
  },
  {
    name: "harbor-api",
    org: "harbor-analytics",
    language: "Python",
    visibility: "private",
    policy: "python-service",
    status: "compliant",
    vars: uv,
  },
  {
    name: "harbor-etl",
    org: "harbor-analytics",
    language: "Python",
    visibility: "private",
    policy: "python-service",
    status: "compliant",
    vars: uv,
  },
  {
    name: "harbor-sdk-python",
    org: "harbor-analytics",
    language: "Python",
    visibility: "public",
    policy: "python-service",
    status: "compliant",
    vars: uv,
  },
  {
    name: "harbor-sdk-js",
    org: "harbor-analytics",
    language: "TypeScript",
    visibility: "public",
    policy: "core-standards",
    status: "pending_sync",
    vars: npm,
  },
  {
    name: "harbor-mobile",
    org: "harbor-analytics",
    language: "Kotlin",
    visibility: "private",
    policy: "core-standards",
    status: "pending_sync",
    vars: { packageManager: "gradle" },
  },
  {
    name: "harbor-infra",
    org: "harbor-analytics",
    language: "HCL",
    visibility: "private",
    policy: "core-standards",
    status: "sync_failed",
    vars: {},
  },
  {
    name: "harbor-docs",
    org: "harbor-analytics",
    language: "MDX",
    visibility: "public",
    policy: "core-standards",
    status: "pending_sync",
    vars: pnpm,
  },
];

const repoId = (name: string) => uid(NS.repo, REPOS.findIndex((r) => r.name === name) + 1);
const spec = (name: string) => REPOS.find((r) => r.name === name)!;

const repositories: Tables<"repositories">[] = REPOS.map((r, i) => {
  const discovered = ORGS.find((o) => o.login === r.org)!.connected;
  return {
    id: uid(NS.repo, i + 1),
    workspace_id: WORKSPACE_ID,
    installation_id: installationUuid(r.org),
    github_repo_id: 700_000_000 + i * 7919,
    owner_login: r.org,
    name: r.name,
    full_name: `${r.org}/${r.name}`,
    default_branch: "main",
    visibility: r.visibility,
    archived: false,
    primary_language: r.language,
    variables: r.vars,
    last_scanned_at: at("11-16", 3),
    disconnected_at: r.status === "disconnected" ? at("10-20", 9, 12) : null,
    created_at: at(discovered, 14, 12),
    updated_at: at(discovered, 14, 12),
  };
});

// ── Policies and versions ───────────────────────────────────────────────────────

type PolicySpec = {
  slug: PolicySlug;
  name: string;
  description: string;
  targets: TargetId[];
  created: string;
  versions: { semver: string; date: string; by: string; changelog: string }[];
  hasDraft: boolean;
};

const POLICIES: PolicySpec[] = [
  {
    slug: "core-standards",
    name: "Core Standards",
    description: "Baseline commands, coding standards and security rules for every repository.",
    targets: ["agents", "claude", "copilot"],
    created: "08-12",
    versions: [
      {
        semver: "2.1.0",
        date: "08-19",
        by: "daniel",
        changelog: "Import from the v1 workspace. Adds pull request conventions.",
      },
      {
        semver: "2.2.0",
        date: "09-29",
        by: "daniel",
        changelog: "Prefer explicit return types; screenshots required for UI changes.",
      },
      {
        semver: "2.3.0",
        date: "10-28",
        by: "maya",
        changelog:
          "Forbid infra/secrets/**. Adds Claude plan-mode and Copilot test-suggestion overrides.",
      },
    ],
    hasDraft: true,
  },
  {
    slug: "nextjs-supabase",
    name: "Next.js + Supabase",
    description: "App Router, server actions and RLS conventions for product web apps.",
    targets: ["agents", "claude", "copilot"],
    created: "09-10",
    versions: [
      {
        semver: "1.0.0",
        date: "09-14",
        by: "priya",
        changelog: "First version, from the Next.js + Supabase template.",
      },
      {
        semver: "1.1.0",
        date: "11-12",
        by: "priya",
        changelog: "Wrap uncached reads in Suspense with skeleton fallbacks.",
      },
    ],
    hasDraft: false,
  },
  {
    slug: "python-service",
    name: "Python Service",
    description: "uv, pytest and ruff conventions for services and data pipelines.",
    targets: ["agents", "claude"],
    created: "10-08",
    versions: [
      {
        semver: "1.0.0",
        date: "10-13",
        by: "priya",
        changelog: "First version for Python services.",
      },
    ],
    hasDraft: false,
  },
];

const policyId = (slug: PolicySlug) =>
  uid(NS.policy, POLICIES.findIndex((p) => p.slug === slug) + 1);
const policySpec = (slug: PolicySlug) => POLICIES.find((p) => p.slug === slug)!;

const policyVersions: Tables<"policy_versions">[] = [];
const versionIds = new Map<string, string>();
for (const p of POLICIES) {
  for (const v of p.versions) {
    const id = uid(NS.version, policyVersions.length + 1);
    versionIds.set(`${p.slug}@${v.semver}`, id);
    const raw = POLICY_CONTENT[p.slug][v.semver];
    const content = policyContentSchema.parse(raw);
    policyVersions.push({
      id,
      workspace_id: WORKSPACE_ID,
      policy_id: policyId(p.slug),
      semver: v.semver,
      content,
      changelog: v.changelog,
      content_hash: sha(JSON.stringify(content)),
      published_by: userId(v.by),
      published_at: at(v.date, 16),
      created_at: at(v.date, 16),
      updated_at: at(v.date, 16),
    });
  }
}
const versionId = (slug: PolicySlug, semver: string) => versionIds.get(`${slug}@${semver}`)!;

const policies: Tables<"policies">[] = POLICIES.map((p, i) => {
  const latest = p.versions.at(-1)!;
  const draft = p.hasDraft ? policyContentSchema.parse(POLICY_CONTENT[p.slug].draft) : null;
  return {
    id: uid(NS.policy, i + 1),
    workspace_id: WORKSPACE_ID,
    name: p.name,
    slug: p.slug,
    description: p.description,
    current_version_id: versionId(p.slug, latest.semver),
    draft,
    created_by: userId(p.versions[0]!.by),
    created_at: at(p.created, 11),
    updated_at: p.hasDraft ? at("11-15", 18, 40) : at(latest.date, 16),
  };
});

// ── Rollouts ────────────────────────────────────────────────────────────────────

type ItemOutcome = "merged" | "pr_open" | "failed" | "skipped";
type RolloutSpec = {
  policy: PolicySlug;
  semver: string;
  date: string;
  by: string;
  status: Tables<"rollouts">["status"];
  items: Record<string, ItemOutcome>;
};

const northwindCore = [
  "design-system",
  "api-gateway",
  "billing-service",
  "notifications-service",
  "mobile-app",
  "auth-service",
];

const ROLLOUTS: RolloutSpec[] = [
  {
    policy: "core-standards",
    semver: "2.1.0",
    date: "08-20",
    by: "daniel",
    status: "completed",
    items: Object.fromEntries(
      [...northwindCore, "infra-terraform", "legacy-admin"].map((r) => [r, "merged" as const]),
    ),
  },
  {
    policy: "nextjs-supabase",
    semver: "1.0.0",
    date: "09-15",
    by: "priya",
    status: "completed",
    items: Object.fromEntries(
      ["web-app", "marketing-site", "internal-tools", "harbor-web", "harbor-dashboard"].map((r) => [
        r,
        "merged" as const,
      ]),
    ),
  },
  {
    policy: "core-standards",
    semver: "2.2.0",
    date: "09-30",
    by: "daniel",
    status: "completed",
    items: Object.fromEntries(
      [...northwindCore, "infra-terraform", "legacy-admin"].map((r) => [r, "merged" as const]),
    ),
  },
  {
    policy: "python-service",
    semver: "1.0.0",
    date: "10-14",
    by: "priya",
    status: "completed",
    items: Object.fromEntries(
      [
        "data-pipeline",
        "ml-models",
        "search-indexer",
        "harbor-api",
        "harbor-etl",
        "harbor-sdk-python",
      ].map((r) => [r, "merged" as const]),
    ),
  },
  {
    policy: "core-standards",
    semver: "2.3.0",
    date: "10-29",
    by: "maya",
    status: "completed_with_errors",
    items: {
      ...Object.fromEntries(northwindCore.map((r) => [r, "merged" as const])),
      "mobile-app": "failed",
      "infra-terraform": "skipped",
      "legacy-admin": "skipped",
    },
  },
  {
    policy: "core-standards",
    semver: "2.3.0",
    date: "11-14",
    by: "daniel",
    status: "running",
    items: {
      "harbor-sdk-js": "pr_open",
      "harbor-mobile": "pr_open",
      "harbor-infra": "failed",
      "harbor-docs": "pr_open",
    },
  },
];

const ERRORS: Record<string, { code: string; message: string }> = {
  "mobile-app": {
    code: "branch_protection",
    message:
      "Branch protection blocks branch creation. Allow the ContextOps app to create contextops/* branches in the repo's ruleset.",
  },
  "harbor-infra": {
    code: "missing_permission",
    message:
      "The ContextOps app lacks Contents: write on this repository. An org admin can grant it under the app's installation settings.",
  },
};

const rollouts: Tables<"rollouts">[] = [];
const rolloutItems: Tables<"rollout_items">[] = [];
const syncPullRequests: Tables<"sync_pull_requests">[] = [];
/** repo name → latest merged version, for file states. */
const appliedVersion = new Map<string, { slug: PolicySlug; semver: string; mergedAt: string }>();
const prCounter = new Map<string, number>();

ROLLOUTS.forEach((r, ri) => {
  const rolloutId = uid(NS.rollout, ri + 1);
  const started = at(r.date, 10, 0);
  const finished = r.status === "running" ? null : at(r.date, 10, 7);
  const ps = policySpec(r.policy);
  rollouts.push({
    id: rolloutId,
    workspace_id: WORKSPACE_ID,
    policy_version_id: versionId(r.policy, r.semver),
    targets: ps.targets,
    status: r.status,
    created_by: userId(r.by),
    started_at: started,
    finished_at: finished,
    created_at: started,
    updated_at: finished ?? started,
  });

  Object.entries(r.items).forEach(([repo, outcome], ii) => {
    const itemId = uid(NS.item, rolloutItems.length + 1);
    const full = `${spec(repo).org}/${repo}`;
    const opened = at(r.date, 10, 1 + (ii % 5));
    const branch = outcome === "skipped" ? null : `contextops/sync-${r.policy}`;
    let prNumber: number | null = null;
    let prUrl: string | null = null;

    if (outcome === "merged" || outcome === "pr_open") {
      const next = (prCounter.get(repo) ?? 40 + ((repo.length * 37) % 300)) + 1 + (ii % 3);
      prCounter.set(repo, next);
      prNumber = next;
      prUrl = `https://github.com/${full}/pull/${next}`;
      const mergedAt =
        outcome === "merged" ? at(nextDay(r.date, 1 + (ii % 3)), 9 + (ii % 8), 30) : null;
      syncPullRequests.push({
        id: uid(NS.pr, syncPullRequests.length + 1),
        workspace_id: WORKSPACE_ID,
        repository_id: repoId(repo),
        rollout_item_id: itemId,
        pr_number: next,
        pr_url: prUrl,
        title: `chore(agents): sync ${ps.name} v${r.semver}`,
        state: outcome === "merged" ? "merged" : "open",
        head_sha: gitSha(`${repo}-${r.semver}`),
        opened_at: opened,
        merged_at: mergedAt,
        closed_at: mergedAt,
        created_at: opened,
        updated_at: mergedAt ?? opened,
      });
      if (mergedAt) appliedVersion.set(repo, { slug: r.policy, semver: r.semver, mergedAt });
    }

    const err = outcome === "failed" ? ERRORS[repo] : undefined;
    rolloutItems.push({
      id: itemId,
      workspace_id: WORKSPACE_ID,
      rollout_id: rolloutId,
      repository_id: repoId(repo),
      status: outcome === "skipped" ? "skipped" : outcome,
      branch,
      pr_number: prNumber,
      pr_url: prUrl,
      error_code: err?.code ?? null,
      error_message: err?.message ?? null,
      created_at: started,
      updated_at: opened,
    });
  });
});

function nextDay(date: string, days: number): string {
  const d = new Date(`2026-${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(5, 10);
}

// ── Assignments, exemptions, file states ────────────────────────────────────────

const assignments: Tables<"policy_assignments">[] = REPOS.filter((r) => r.policy).map((r, i) => {
  const first = rolloutItems.find((it) => it.repository_id === repoId(r.name));
  const created = first?.created_at ?? at("11-13", 12);
  return {
    id: uid(NS.assignment, i + 1),
    workspace_id: WORKSPACE_ID,
    repository_id: repoId(r.name),
    policy_id: policyId(r.policy!),
    pinned_version_id: null,
    track_latest: true,
    targets: policySpec(r.policy!).targets,
    created_at: created,
    updated_at: created,
  };
});

const exemptions: Tables<"repo_exemptions">[] = [
  {
    id: uid(NS.exemption, 1),
    workspace_id: WORKSPACE_ID,
    repository_id: repoId("infra-terraform"),
    reason:
      "Terraform modules follow the platform team's own agent rules until the Q1 infra migration.",
    expires_at: "2027-01-31T23:59:00.000Z",
    revoked_at: null,
    created_by: userId("maya"),
    created_at: at("10-05", 13),
    updated_at: at("10-05", 13),
  },
];

/** Hash of a rendered managed block. Stand-in until the renderer exists (phase 2). */
const blockHash = (slug: PolicySlug, semver: string, target: TargetId, repo: string) =>
  sha(`${slug}@${semver}:${target}:${repo}`);

const fileStates: Tables<"repo_file_states">[] = [];
for (const r of REPOS) {
  const targets: TargetId[] = r.policy ? policySpec(r.policy).targets : ["agents"];
  for (const target of targets) {
    const applied = appliedVersion.get(r.name);
    const expected = applied ? blockHash(applied.slug, applied.semver, target, r.name) : null;
    const isDrifted = r.drifted === target;
    // Unassigned docs repo has a hand-written AGENTS.md (no markers): an import candidate.
    const handWritten = r.status === "unassigned";
    const managed = applied ? (isDrifted ? sha(`edited:${r.name}:${target}`) : expected) : null;
    fileStates.push({
      id: uid(NS.fileState, fileStates.length + 1),
      workspace_id: WORKSPACE_ID,
      repository_id: repoId(r.name),
      target,
      path: TARGETS[target].path,
      blob_sha: applied || handWritten ? gitSha(`${r.name}:${target}:${managed ?? "hand"}`) : null,
      managed_hash: managed,
      expected_hash: expected,
      applied_version_id: applied ? versionId(applied.slug, applied.semver) : null,
      drift_diff: isDrifted ? DRIFT_DIFFS[r.name]! : null,
      checked_at: r.status === "disconnected" ? at("10-20", 3) : at("11-16", 3),
      created_at: repositories.find((x) => x.name === r.name)!.created_at,
      updated_at: at("11-16", 3),
    });
  }
}

// ── Audit log ───────────────────────────────────────────────────────────────────

type AuditDraft = Omit<Tables<"audit_events">, "id" | "workspace_id" | "updated_at">;
const drafts: AuditDraft[] = [];
const userEvent = (
  key: string,
  created_at: string,
  action: string,
  subject_type: string,
  subject_id: string | null,
  metadata: Record<string, unknown> = {},
) =>
  drafts.push({
    actor_id: userId(key),
    actor_type: "user",
    created_at,
    action,
    subject_type,
    subject_id,
    metadata: metadata as AuditDraft["metadata"],
  });
const systemEvent = (
  actor_type: "system" | "github",
  created_at: string,
  action: string,
  subject_type: string,
  subject_id: string | null,
  metadata: Record<string, unknown> = {},
) =>
  drafts.push({
    actor_id: null,
    actor_type,
    created_at,
    action,
    subject_type,
    subject_id,
    metadata: metadata as AuditDraft["metadata"],
  });

userEvent("maya", at("08-01", 14), "workspace.created", "workspace", WORKSPACE_ID, {
  name: "Northwind Labs",
});
for (const o of ORGS) {
  userEvent(
    o.login === "northwind-labs" ? "maya" : "daniel",
    at(o.connected, 14, 10),
    "github.connected",
    "github_installation",
    installationUuid(o.login),
    { account: o.login, repo_selection: o.selection },
  );
}
for (const p of PEOPLE.filter((p) => p.role !== "owner")) {
  userEvent(
    p.key === "sam" ? "daniel" : "maya",
    at(nextDay(p.joined, -1), 12),
    "member.invited",
    "invitation",
    null,
    { email: p.email, role: p.role },
  );
  userEvent(p.key, at(p.joined, 14, 5), "member.joined", "workspace_member", userId(p.key), {
    role: p.role,
  });
}
userEvent("maya", at("09-20", 11), "member.role_changed", "workspace_member", userId("daniel"), {
  before: { role: "editor" },
  after: { role: "admin" },
});
userEvent("daniel", at("11-13", 10), "member.invited", "invitation", invitations[0]!.id, {
  email: invitations[0]!.email,
  role: "viewer",
});
for (const p of POLICIES) {
  userEvent(p.versions[0]!.by, at(p.created, 11), "policy.created", "policy", policyId(p.slug), {
    name: p.name,
  });
  for (const v of p.versions) {
    userEvent(
      v.by,
      at(nextDay(v.date, -1), 17),
      "policy.draft_saved",
      "policy",
      policyId(p.slug),
      {},
    );
    userEvent(
      v.by,
      at(v.date, 16),
      "policy.published",
      "policy_version",
      versionId(p.slug, v.semver),
      { policy: p.name, version: v.semver, changelog: v.changelog },
    );
  }
}
userEvent(
  "priya",
  at("11-15", 18, 40),
  "policy.draft_saved",
  "policy",
  policyId("core-standards"),
  {},
);
for (const a of assignments) {
  const repo = repositories.find((r) => r.id === a.repository_id)!;
  const p = policies.find((x) => x.id === a.policy_id)!;
  userEvent("daniel", a.created_at, "assignment.created", "repository", repo.id, {
    repository: repo.full_name,
    policy: p.name,
    track_latest: true,
  });
}
rollouts.forEach((r, i) => {
  const spec = ROLLOUTS[i]!;
  const p = policySpec(spec.policy);
  userEvent(spec.by, r.created_at, "rollout.started", "rollout", r.id, {
    policy: p.name,
    version: spec.semver,
    repositories: Object.keys(spec.items).length,
  });
  if (r.finished_at)
    systemEvent(
      "system",
      r.finished_at,
      `rollout.${r.status === "completed" ? "completed" : "finished_with_errors"}`,
      "rollout",
      r.id,
      { policy: p.name, version: spec.semver },
    );
});
for (const pr of syncPullRequests) {
  const repo = repositories.find((r) => r.id === pr.repository_id)!;
  systemEvent("system", pr.opened_at, "pull_request.opened", "repository", repo.id, {
    repository: repo.full_name,
    number: pr.pr_number,
    title: pr.title,
  });
  if (pr.merged_at)
    systemEvent("github", pr.merged_at, "pull_request.merged", "repository", repo.id, {
      repository: repo.full_name,
      number: pr.pr_number,
    });
}
for (const item of rolloutItems.filter((i) => i.status === "failed")) {
  const repo = repositories.find((r) => r.id === item.repository_id)!;
  systemEvent("system", item.updated_at, "rollout.item_failed", "repository", repo.id, {
    repository: repo.full_name,
    error_code: item.error_code,
  });
}
userEvent(
  "maya",
  exemptions[0]!.created_at,
  "exemption.created",
  "repository",
  repoId("infra-terraform"),
  { reason: exemptions[0]!.reason, expires_at: exemptions[0]!.expires_at },
);
systemEvent(
  "github",
  at("10-20", 9, 12),
  "repository.disconnected",
  "repository",
  repoId("legacy-admin"),
  { repository: "northwind-labs/legacy-admin", reason: "Removed from the installation" },
);
const driftTimes: Record<string, string> = {
  "billing-service": at("11-11", 14, 22),
  "ml-models": at("11-08", 9, 3),
  "harbor-dashboard": at("11-15", 16, 47),
};
for (const [repo, time] of Object.entries(driftTimes)) {
  systemEvent("github", time, "repository.drift_detected", "repository", repoId(repo), {
    repository: `${spec(repo).org}/${repo}`,
    target: spec(repo).drifted,
  });
}
userEvent("maya", at("10-02", 9), "workspace.settings_updated", "workspace", WORKSPACE_ID, {
  before: { rolloutsByEditors: "never" },
  after: { rolloutsByEditors: "with_approval" },
});

// Pad with nightly drift scans, newest first, until there are exactly 200 events.
const TOTAL_AUDIT_EVENTS = 200;
for (let day = 0; drafts.length < TOTAL_AUDIT_EVENTS; day++) {
  systemEvent(
    "system",
    at(nextDay("11-16", -day), 3, 0),
    "drift_scan.completed",
    "workspace",
    WORKSPACE_ID,
    { repositories_checked: 22 },
  );
}
if (drafts.length !== TOTAL_AUDIT_EVENTS)
  throw new Error(`Expected ${TOTAL_AUDIT_EVENTS} audit events, built ${drafts.length}`);

const auditEvents: Tables<"audit_events">[] = drafts
  .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.action.localeCompare(b.action))
  .map((d, i) => ({
    ...d,
    id: uid(NS.audit, i + 1),
    workspace_id: WORKSPACE_ID,
    updated_at: d.created_at,
  }));

// ── Export ──────────────────────────────────────────────────────────────────────

export const northwind = {
  users: PEOPLE.map((p) => ({
    id: userId(p.key),
    email: p.email,
    name: p.name,
    login: p.login,
    created_at: at(p.joined, 14),
  })),
  profiles,
  workspaces: [workspace],
  workspaceMembers: members,
  invitations,
  githubInstallations: installations,
  repositories,
  policies,
  policyVersions,
  policyAssignments: assignments,
  repoExemptions: exemptions,
  repoFileStates: fileStates,
  rollouts,
  rolloutItems,
  syncPullRequests,
  auditEvents,
  /** Expected derived status per repo, used to check the seed against the SQL view. */
  expectedStatus: Object.fromEntries(REPOS.map((r) => [repoId(r.name), r.status])) as Record<
    string,
    DemoStatus
  >,
  /** The demo account (workspace owner). Local and preview databases only; see DEMO_SIGN_IN. */
  demoUser: {
    id: userId("maya"),
    email: PEOPLE.find((p) => p.key === "maya")!.email,
    password: "northwind-demo",
  },
};

export type NorthwindDataset = typeof northwind;
