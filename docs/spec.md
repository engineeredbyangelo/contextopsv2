# ContextOps — Product & Technical Spec (v2 Rebuild)

Nov 10, 2026 · @Angelo Applewhite

## Product summary

ContextOps v2 is policy-as-code for AI coding agents: a team writes one versioned policy, assigns it to GitHub repositories, and ContextOps renders AGENTS.md, CLAUDE.md and Copilot instructions into each repo through pull requests, then flags any repo that drifts.

The v1 Lovable build proved the screens. v2 makes the product real: a production Next.js codebase you own, real GitHub sign-in, a GitHub App with access to public and private repos, a background sync engine, and multi-tenant data isolation enforced in the database.

**Who it is for**

- **Engineering agencies and startup studios** that manage many client GitHub orgs and need one standard across all of them.
- **Fractional CTOs** who set engineering rules for several companies at once.
- **DevEx and platform leads** who want AI agents in every repo following the same commands, standards and security rules.

**What changes from v1**

- **Real backend.** Supabase Postgres with row-level security, a GitHub App, webhooks and a job queue replace mock data.
- **Multi-org by design.** One workspace can connect several GitHub orgs, which is the core agency use case.
- **Import before you author.** Onboarding scans connected repos for existing agent files and offers to turn the best one into the first policy.
- **Managed blocks, not file takeovers.** ContextOps only owns a marked region of each file, so repo-specific notes outside it survive every sync.
- **Pull requests only.** ContextOps never pushes to a default branch or merges. Every change is reviewable.

**Guiding principles**

1. Time to first sync PR under 10 minutes from sign-up.
2. Least-privilege GitHub access; no source code stored.
3. Every policy change is versioned, diffable and audited.
4. Calm, dense UI in the Linear/Vercel/GitHub tradition, dark by default, keyboard-first.

## Tech stack

The stack keeps everything you already know from Lovable (React, TypeScript, Tailwind, shadcn/ui, Supabase, Stripe) and adds the three things Lovable could not give you: server-side GitHub App code, durable background jobs and webhook handling.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript strict | Server components, server actions and route handlers in one app; deploys cleanly to Vercel |
| UI | Tailwind, shadcn/ui, Radix, lucide-react, next-themes | Accessible primitives, dark default with light mode |
| Tables, charts | TanStack Table, Recharts | Dense sortable tables; compliance trend chart |
| Editor, diff | CodeMirror 6 (markdown), react-markdown + remark-gfm, a unified diff viewer (diff + react-diff-view) | Policy markdown editing, preview and file diffs |
| Forms, validation | react-hook-form + Zod | One Zod schema validates the policy in the browser, server and job runner |
| Database | Supabase Postgres + row-level security | Multi-tenant isolation enforced in the database |
| Migrations, types | Supabase CLI migrations + generated TypeScript types | Schema lives in git; typed queries |
| Auth | Supabase Auth with GitHub sign-in | GitHub is the identity your users already have |
| GitHub access | A ContextOps GitHub App + Octokit (@octokit/app, @octokit/rest, webhooks) | Short-lived installation tokens, fine-grained repo permissions, works on private repos |
| Background jobs | Inngest | Durable step functions, retries, per-installation concurrency limits, cron for drift scans |
| Billing | Stripe Checkout + Customer Portal + webhooks | Plans priced by connected repositories |
| Email | Resend + React Email | Invites, rollout summaries, drift alerts |
| Hosting | Vercel (app), Supabase (data), Inngest Cloud (jobs) | No servers to run |
| Observability | Sentry (errors), PostHog (product analytics), Axiom or Vercel logs | Trace a failed PR back to its job run |
| Testing | Vitest (renderer, policy schema), Playwright (core flows), MSW for GitHub API mocks | The renderer is the product; it gets the most tests |
| Tooling | pnpm, ESLint, Prettier, GitHub Actions CI | Standard |

Pin current stable versions when you scaffold; nothing here depends on a specific release.

## Architecture

The web app never talks to GitHub on a user's click for anything slow; it writes a row and emits an event, and Inngest jobs do the GitHub work with installation tokens.

&#91;embedded content: system architecture · 6 components\]

A user request touches only Next.js and Supabase; every call to GitHub runs in an Inngest job with an installation token.

**Request paths**

- **Reads** (dashboards, lists): server components query Supabase with the user's session, so RLS scopes every row to their workspace.
- **Writes** (publish a policy, start a rollout): server actions validate with Zod, write to Postgres, append an audit event, then send an Inngest event.
- **GitHub work** (render, branch, commit, open PR, scan for drift): Inngest functions mint an installation token per run and use a service-role Supabase client. Concurrency is keyed per installation so one big org cannot starve another or trip rate limits.
- **Inbound**: `/api/webhooks/github` verifies the `X-Hub-Signature-256` signature and forwards the event to Inngest; `/api/webhooks/stripe` does the same for billing.

**Multi-tenancy**

- Every tenant table carries `workspace_id`. RLS policies call a `is_workspace_member(workspace_id)` SQL function backed by `workspace_members`.
- A workspace owns one or more GitHub App installations, so an agency can attach each client org to its own workspace or several orgs to one.
- The service-role key is used only inside job functions and webhook handlers, never in code paths a user request reaches directly.

**Two kinds of GitHub access, kept separate**

- **User identity** (who is signed in): GitHub sign-in through Supabase Auth.
- **Repository access** (what ContextOps can read and change): the GitHub App installation, granted per org by an org admin. Repo work never uses a person's token, so removing a teammate never breaks syncs.

## Authentication & authorization

Users sign in with GitHub through Supabase Auth; ContextOps acts on repositories only through GitHub App installation tokens that live for about an hour and are never stored.

**Sign-in**

1. `/login` shows one button: Continue with GitHub. Optional later: Google and email magic link for non-engineering stakeholders (billing admins, PMs).
2. Supabase handles the OAuth round trip to `/auth/callback`, sets an httpOnly session cookie via `@supabase/ssr`, and middleware refreshes it.
3. First sign-in creates a `profiles` row (GitHub login, avatar, name) and routes to `/onboarding`. Returning users go to their last workspace.

**Connecting GitHub orgs (the App install)**

1. From onboarding or Settings → Integrations, the user clicks Connect GitHub organization and goes to the App's install page, where an org admin picks all repos or selected repos.
2. GitHub redirects back to the App's setup URL with `installation_id`. Turn on *Request user authorization during installation* so the redirect also carries a `code`.
3. The callback exchanges that code for a user token and calls `GET /user/installations` to confirm this user can see the installation. This blocks someone from pasting another org's `installation_id` into the URL.
4. Save the installation against the workspace, discard the user token, and queue a repo sync job.
5. If the user is not an org admin, GitHub sends an install request to their admins; the UI shows *Waiting for org approval* and a copyable message for the admin.

**GitHub App permissions (least privilege)**

| Permission | Access | Used for |
| --- | --- | --- |
| Metadata | Read | List repos, default branch, visibility |
| Contents | Read & write | Read current agent files; create branches and commits |
| Pull requests | Read & write | Open, update and track sync PRs |
| Checks (phase 3) | Read & write | Optional ContextOps compliance check on PRs |

Webhook events: `installation`, `installation_repositories`, `push`, `pull_request`, `repository` (renames, archives, default-branch changes).

**Workspace roles**

| Role | Can |
| --- | --- |
| Owner | Everything, including billing, deleting the workspace and transferring ownership |
| Admin | Manage members, GitHub connections, policies, rollouts, exemptions |
| Editor | Create and edit policy drafts; start rollouts if the workspace allows it |
| Viewer | Read everything except billing; ideal for a client's engineers |

Roles are checked twice: RLS in Postgres for data, and a `requireRole()` guard in every server action for intent. Optional setting: publishing a policy version requires a second admin's approval.

**Invites**: email invite with a signed, single-use token at `/invite/[token]`, valid 7 days; the invitee signs in with GitHub and joins with the invited role.

**Secrets**: the App private key, webhook secret, Supabase service-role key and Stripe keys live only in Vercel and Inngest environment variables. Nothing secret ships to the browser except the Supabase anon key.

## GitHub integration & sync engine

The engine does four jobs: discover repos, render files, open or update one sync PR per repo, and detect drift. Each is an idempotent Inngest function, so a retry never opens a duplicate PR.

**1. Repo discovery**

- On install and on `installation_repositories` events, list the installation's repos and upsert them (GitHub repo id is the stable key, so renames are safe).
- Store name, owner, visibility, default branch, archived flag, primary language. Archived repos are hidden and skipped.
- First scan reads `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md` on the default branch and records each file's blob SHA. This powers the *import an existing file* onboarding step and the first drift baseline.

**2. Rendering**

- A pure function `render(policyVersion, repoVariables, target) → string` in `packages/renderer`, with snapshot tests. Same input, byte-identical output.
- Output is wrapped in a managed block:

```markdown
<!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:…" -->
…generated content…
<!-- contextops:end -->
```

- Anything a repo writes outside the markers is preserved on every sync. If the file has no markers yet, the first sync PR adds the block and keeps existing content below a *Repository notes* heading.

**3. Sync pull requests**

1. Mint an installation token; read the current target files and default-branch head SHA.
2. Render each selected target. If every rendered block already matches, mark the repo Compliant and stop; no empty PRs.
3. Create or reuse branch `contextops/sync-<policy-slug>`. Write all files in one commit through the Git Data API (blobs → tree → commit → ref update).
4. If an open ContextOps PR exists for that repo, update its branch and description; otherwise open one. Title: `chore(agents): sync Core Standards v2.3.0`. Body: changelog, a summary of changed sections, and a link back to the rollout.
5. Record the PR number and URL; `pull_request` webhooks move it to merged or closed.

ContextOps never merges and never pushes to the default branch. Branch protection, required reviews and CODEOWNERS all apply as normal.

**4. Drift detection**

- On every `push` to a default branch that touches a target path, re-read the file and compare the managed block's hash to the expected render.
- A nightly cron re-checks every assigned repo, catching anything a missed webhook would hide.
- Drift detail stores which target drifted and the diff, which the repository page shows in the file-diff viewer.

&#91;embedded content: repository compliance states · 5 states\]

Drift and failures always route back through Pending sync, so the only way to Compliant is a merged pull request. Exempted repos return to normal evaluation when the exemption expires.

**Rate limits and failure handling**

- Concurrency limit per installation (start at 5 parallel repo jobs) plus exponential backoff on 403/429 secondary-rate-limit responses.
- Every failure is stored on the rollout item with a human-readable reason and a fix: *Branch protection blocks branch creation*, *App lacks access to this repo*, *File is larger than 1 MB*.
- Uninstall or repo removal events mark affected repos Disconnected and pause assignments rather than deleting history.

**Public and private repos** are handled identically: access comes from the installation, not visibility. ContextOps stores only target files and metadata, never other source code.

## Data model

Fifteen tables cover v2. Every tenant table has `id uuid`, `workspace_id`, `created_at`, `updated_at`, and RLS enabled; published policy versions and audit events are append-only.

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | user\_id (auth.users), github\_login, name, avatar\_url | One per person, global |
| `workspaces` | name, slug, plan, stripe\_customer\_id, settings jsonb | Tenant root |
| `workspace_members` | workspace\_id, user\_id, role | owner · admin · editor · viewer |
| `invitations` | email, role, token\_hash, expires\_at, accepted\_at | Token stored hashed |
| `github_installations` | installation\_id, account\_login, account\_type, repo\_selection, suspended\_at | Many per workspace |
| `repositories` | installation\_id, github\_repo\_id, full\_name, default\_branch, visibility, archived, variables jsonb | variables = per-repo values like package manager |
| `policies` | name, slug, description, current\_version\_id, draft jsonb | One editable draft per policy |
| `policy_versions` | policy\_id, semver, content jsonb, changelog, content\_hash, published\_by, published\_at | Immutable once published |
| `policy_assignments` | repository\_id, policy\_id, pinned\_version\_id or track\_latest, targets text\[\] | One active assignment per repo |
| `repo_exemptions` | repository\_id, reason, expires\_at, created\_by | Exempted state with an optional end date |
| `repo_file_states` | repository\_id, target, blob\_sha, managed\_hash, expected\_hash, checked\_at | Drives compliance status |
| `rollouts` | policy\_version\_id, targets text\[\], status, created\_by, started\_at, finished\_at | One per multi-repo sync |
| `rollout_items` | rollout\_id, repository\_id, status, branch, pr\_number, pr\_url, error\_code, error\_message | One row per repo in a rollout |
| `sync_pull_requests` | repository\_id, pr\_number, state, head\_sha, rollout\_item\_id | Tracks every PR ContextOps opened |
| `audit_events` | actor\_id, actor\_type (user, system, github), action, subject\_type, subject\_id, metadata jsonb | Insert-only via a security-definer function |

**Compliance status is derived, not stored by hand.** A SQL view `repository_status` computes it from the assignment, exemption, file states and open sync PRs, so the dashboard KPIs and the repository list can never disagree.

## Policy model

A policy is structured JSON validated by one Zod schema; markdown is only an output. That is what lets ContextOps diff versions section by section and render the same rules into three different files.

```json
{
  "overview": { "summary": "…", "stack": ["Next.js", "Supabase"] },
  "commands": { "install": "{{packageManager}} install", "dev": "…", "test": "…", "lint": "…", "typecheck": "…", "build": "…" },
  "codingStandards": [{ "rule": "…", "severity": "must|should" }],
  "security": { "secrets": "…", "forbiddenPaths": [".env*"], "dependencies": "…" },
  "pullRequests": { "branchNaming": "…", "commitStyle": "conventional", "checklist": ["…"] },
  "overrides": { "claude": { "append": "…" }, "copilot": { "append": "…" }, "agents": {} },
  "freeform": "optional markdown appended at the end"
}
```

**Versioning**

- Editing always happens on a draft. *Publish version* asks for a semver bump (patch, minor, major) and a required changelog, then freezes the content as a `policy_versions` row.
- *Save draft* keeps work private to the workspace without touching any repo.
- Version history shows a section-level diff between any two versions plus the rendered-file diff.
- Assignments either track latest (new versions trigger a suggested rollout) or pin a version (major bumps never auto-apply).

**Repository variables**

Per-repo values such as `packageManager`, `testCommand` or `nodeVersion` fill `{{placeholders}}`. Defaults come from the first scan (lockfile detection), so one policy fits pnpm and npm repos without forking it.

**Output targets**

| Target | Path | Rendering |
| --- | --- | --- |
| AGENTS.md | `AGENTS.md` | Full policy; the canonical file |
| Claude Code | `CLAUDE.md` | Choice per policy: full copy, or a short file that imports `@AGENTS.md` plus Claude-specific overrides |
| GitHub Copilot | `.github/copilot-instructions.md` | Full policy with Copilot overrides |

Targets are a registry in the renderer, so adding Cursor rules or others later is a new module, not a schema change.

**Out of scope for v2**: layered policies (a base policy plus stack-specific add-ons). The schema reserves an `extends` field so it can arrive without a migration.

## User flows

Eight flows cover the product; the first one is the one to obsess over, because a team that sees its first sync PR merged in one sitting stays.

**1. Sign-up to first sync PR (target: under 10 minutes)**

1. Landing page → Start free → Continue with GitHub.
2. Onboarding step 1, *Name your workspace*: name, slug, and *Who is this for?* (my company · clients I manage). The second answer turns on multi-org hints.
3. Step 2, *Connect GitHub*: install the App on one org; choose all or selected repos. Live list of repos appears as discovery finishes.
4. Step 3, *Start your policy*: three cards — Import from a repo (we found 4 existing AGENTS.md / CLAUDE.md files), Start from a template (Next.js + Supabase, Python service, Monorepo), or Blank.
5. Step 4, *Pick repos*: preselect repos without agent files and repos sharing the imported file's stack.
6. Step 5, *Preview and open PRs*: per-repo file diff, then Open pull requests. Land on the rollout page, watching PRs appear live.

Every step can be skipped and resumed from a setup checklist on the dashboard.

**2. Author a policy**: Policies → New → fill tabs with form controls on the left and live rendered preview on the right (toggle AGENTS.md / CLAUDE.md / Copilot) → Save draft or Publish version with semver bump and changelog.

**3. Assign and roll out**: Rollouts → New rollout wizard: choose policy version → select repos (filter by org, language, status; bulk select) → choose targets → preview summary (repos changing, unchanged, blocked) → confirm → progress table with branch, PR link, status, error and Retry.

**4. Ship a new version**: publishing v2.4.0 of a policy that repos track triggers a banner: *14 repos are on v2.3.0 · Roll out v2.4.0*. One click pre-fills the wizard.

**5. Remediate drift**: dashboard Drifted card → repo detail shows which file drifted and the diff → choose Re-sync (opens or updates the PR), Accept as repo notes (moves the edit outside the managed block in the PR), or Mark exempt.

**6. Exempt a repo**: Mark exempt → reason (required) + optional expiry → repo shows Exempted, excluded from KPIs and rollouts until expiry, then returns to normal with an alert.

**7. Invite the team or a client**: Settings → Team → invite by email with a role; agencies give client engineers Viewer access to show compliance without edit rights.

**8. Upgrade**: hitting the repo limit shows an inline upgrade card; Stripe Checkout returns to Settings → Billing, and the Customer Portal handles invoices and cancellation.

## Routes & screens

Keep the v1 route set, but scope the app under a workspace slug so agencies can switch tenants and share deep links: `/app/[workspace]/…`. `/app` redirects to the last-used workspace.

| Route | Purpose | Change from v1 |
| --- | --- | --- |
| `/` | Marketing landing | Add a live sample of a rendered AGENTS.md diff |
| `/pricing` | Plans and FAQ | Priced by connected repos |
| `/login` | Continue with GitHub | — |
| `/auth/callback` | OAuth return | New |
| `/onboarding` | 5-step wizard | Adds import-existing-file and template steps |
| `/invite/[token]` | Accept invite | New |
| `/app/[ws]` | Overview | Adds setup checklist until first PR merges |
| `/app/[ws]/repositories` | Repo list with status filters | Group by GitHub org; bulk assign |
| `/app/[ws]/repositories/[id]` | Repo detail | Drift diff with three remediation actions; repo variables |
| `/app/[ws]/policies` | Policy library | Shows repos per version and draft badge |
| `/app/[ws]/policies/new` | Create policy | Start from import, template or blank |
| `/app/[ws]/policies/[id]` | Detail, editor, versions, assignments | Editor lives here as a tab; version compare |
| `/app/[ws]/rollouts` | Rollout list | — |
| `/app/[ws]/rollouts/new` | Rollout wizard | New route; was a modal |
| `/app/[ws]/rollouts/[id]` | Live progress | Realtime updates via Supabase Realtime; Retry failed |
| `/app/[ws]/audit-log` | Filterable audit log | CSV export on paid plans |
| `/app/[ws]/settings/{general,team,integrations,billing}` | Settings sub-pages | Split into real routes |
| `/api/webhooks/github`, `/api/webhooks/stripe`, `/api/inngest` | Inbound endpoints | New |

**Sidebar**: workspace switcher at top, then Overview, Repositories, Policies, Rollouts, Audit log, Settings; user menu and theme toggle at the bottom.

**UX upgrades over v1**

- Command palette (⌘K): jump to any repo or policy, start a rollout, switch workspace.
- Every list has a useful empty state with one primary action, never a blank table.
- Status always shows as the same five badges plus Disconnected: Compliant, Drifted, Pending sync, Sync failed, Exempted.
- Errors explain the fix in plain words and link to the GitHub setting involved.
- Keyboard: `j/k` through tables, `g r` repositories, `g p` policies.
- Accessibility: Radix focus management, visible focus rings, status never conveyed by color alone, WCAG AA contrast in both themes.

## Pricing & plans

Price by connected repositories, not seats: agencies want to add client engineers as viewers for free, and repos are what create value. Figures below are starting hypotheses to test, not researched market rates.

| Plan | Price (proposed) | Repos | GitHub orgs | Includes |
| --- | --- | --- | --- | --- |
| Free | $0 | 5 | 1 | 1 policy, all three targets, 30-day audit log |
| Team | $49 / month | 50 | 3 | Unlimited policies, drift alerts, 1-year audit log |
| Agency | $199 / month | 250 | Unlimited | Multiple workspaces, viewer seats for clients, CSV audit export, publish approvals |
| Enterprise | Custom | Custom | Unlimited | SSO/SAML, data retention controls, priority support |

Annual billing at two months free. Limits are enforced in server actions and shown as inline upgrade prompts.

## Security & compliance

The security story is short because ContextOps holds so little: no long-lived GitHub tokens, no source code, and no write access outside pull requests.

- **Data minimization**: stores repo metadata, the three target files' managed blocks and hashes, and policy content. No other repository content is persisted.
- **Tokens**: installation tokens are minted per job and expire in about an hour; user OAuth tokens from installation verification are discarded after the check.
- **Tenant isolation**: RLS on every tenant table, plus automated tests that sign in as a user from workspace A and assert zero rows from workspace B.
- **Webhooks**: HMAC signature verification on GitHub and Stripe, idempotency on GitHub's delivery id.
- **Audit**: every publish, assignment, rollout, exemption, role change and GitHub connection writes an immutable audit event with actor and before/after.
- **Change safety**: PR-only writes, so the customer's branch protection and code review remain the final gate.
- **Path to SOC 2**: Supabase and Vercel both offer SOC 2 reports; document access controls and incident response early so a Type I audit is a paperwork exercise when the first enterprise deal asks.

## Build plan

Build in four phases, each ending in something demoable; phase 2 is the first point where a real PR lands in a real repo, so reach it fast.

1. **Phase 1: Shell and data (mock-backed UI)**
   - Scaffold Next.js, Tailwind, shadcn/ui, theming, sidebar, ⌘K, all routes.
   - Supabase schema, RLS, seed script with the fictional org *Northwind Labs* (24 repos across 2 orgs, 3 policies, 6 rollouts, 200 audit events).
   - Pages read from Supabase from day one; seed data replaces mock JSON, so nothing gets thrown away.
   - Done when: every route renders from the database in both themes on mobile and desktop.
2. **Phase 2: Auth and first real PR**
   - GitHub sign-in, workspaces, roles, invites.
   - GitHub App, install flow with verification, repo discovery, renderer package with snapshot tests, single-repo sync PR.
   - Done when: you sign up on a fresh account, install the App on a test org and merge a PR that adds AGENTS.md.
3. **Phase 3: Rollouts and drift**
   - Inngest rollout fan-out, progress page with Realtime, retries and error mapping.
   - Push webhook and nightly drift scan, drift diff, remediation actions, exemptions.
   - Policy editor with versioning, changelog and version compare.
   - Done when: a 20-repo rollout completes and a manual edit to CLAUDE.md flips that repo to Drifted within a minute.
4. **Phase 4: Billing and launch**
   - Stripe plans and limits, landing and pricing pages, onboarding polish, Sentry and PostHog, audit export.
   - Done when: a stranger can sign up, pay, and sync repos without talking to you.

**Repository layout**

```text
contextops/
  apps/web/                 Next.js app (routes, components, server actions)
    src/app/                routes from the table above
    src/components/         ui/ (shadcn), app/ (domain components)
    src/server/             actions, auth guards, Supabase clients
    src/inngest/            job functions: discover, rollout, sync-repo, drift-scan
    src/lib/github/         App auth, Octokit helpers, webhook verification
  packages/renderer/        pure policy → file rendering + snapshot tests
  packages/policy-schema/   Zod schema shared by app and jobs
  supabase/migrations/      SQL migrations, RLS, views
  supabase/seed.sql         Northwind Labs demo data
```

**Environment variables**

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GITHUB_APP_ID
GITHUB_APP_SLUG
GITHUB_APP_PRIVATE_KEY
GITHUB_APP_CLIENT_ID
GITHUB_APP_CLIENT_SECRET
GITHUB_WEBHOOK_SECRET
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
SENTRY_DSN
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_APP_URL
```

**Definition of done for any feature**: typed end to end, RLS test for new tables, audit event for every mutation, empty, loading and error states, keyboard reachable, works in both themes.

## Open questions

- [x] One GitHub App for both sign-in and repo access, or a separate OAuth App for sign-in? One App is simpler for users; confirm Supabase's GitHub provider works with the App's client credentials during phase 2 setup. One github app for both sign in and repo access
- [x] CLAUDE.md default: full copy or thin file importing `@AGENTS.md`? Full copy
- [x] Should Editors be allowed to start rollouts, or Admins only? Editors can start rollout if approved by admin
- [x] Add a ContextOps check run on PRs in v2, or hold for v3? check run on V2
- [x] Which extra targets come next (Cursor rules, others), based on what early customers use? cursor rules most likely
- [x] Pricing: validate the repo-based tiers with 5 agency conversations before building billing.
- [x] Domain, logo and brand for launch (contextops.dev or similar). I already have a domain I will pull from v1 and connect to the rebuild.
