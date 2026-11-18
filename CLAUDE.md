# ContextOps v2

Policy-as-code for AI coding agents. A team writes one versioned policy, assigns it to GitHub repos, and ContextOps renders `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md` into each repo **through pull requests**, then flags repos that drift.

- **Spec (source of truth for product and architecture):** [docs/spec.md](docs/spec.md)
- **Build progress and next steps:** [docs/STATUS.md](docs/STATUS.md)

## Start of every session

1. Read `docs/STATUS.md`. Pick up from **Next steps**, item 1, unless the user says otherwise.
2. Check `git branch --show-current` and `git status`. Work goes on the phase branch, never on `main`.
3. Before writing Next.js code, read `apps/web/AGENTS.md`. This Next.js (16.x) differs from your training data; check `node_modules/next/dist/docs/`.
4. End sessions (or hand off) with `/save-context`.

## Stack

Next.js App Router (TypeScript strict) · Tailwind + shadcn/ui + Radix · TanStack Table, Recharts · CodeMirror 6, react-diff-view · react-hook-form + Zod · Supabase (Postgres + RLS, Auth with GitHub) · GitHub App + Octokit · Inngest · Stripe · Resend · Sentry, PostHog · Vitest, Playwright, MSW, pgTAP · pnpm workspaces, Node 22+.

## Layout

```text
apps/web/src/app/            routes (see spec "Routes & screens"; app routes live under /app/[ws]/…)
apps/web/src/components/     ui/ (shadcn, don't hand-edit), app/ (domain components)
apps/web/src/server/         data/ (read layer all pages use), actions/, auth/, supabase/ (clients, generated types), demo/ (Northwind dataset)
apps/web/src/inngest/        job functions: discover, rollout, sync-repo, drift-scan
apps/web/src/lib/github/     App auth, Octokit helpers, webhook verification
apps/web/e2e/                Playwright
packages/policy-schema/      the Zod policy schema, shared by browser, server and jobs
packages/renderer/           pure render(policyVersion, repoVariables, target) → string
supabase/migrations/         SQL migrations, RLS, views     supabase/tests/database/  pgTAP
supabase/seed.sql            GENERATED from server/demo; never edit by hand (`pnpm db:seed:generate`)
```

## Non-negotiable rules (from the spec)

- **PR-only writes.** ContextOps never pushes to a default branch and never merges. One sync PR per repo, on branch `contextops/sync-<policy-slug>`; reuse an open one. No empty PRs.
- **Managed blocks.** Only the region between `<!-- contextops:begin … -->` and `<!-- contextops:end -->` is ours. Content outside the markers is preserved byte for byte.
- **The renderer is pure and deterministic.** Same input gives byte-identical output. No I/O, clock or randomness in `packages/renderer`.
- **Policy is structured JSON validated by the one Zod schema** in `packages/policy-schema`. Markdown is only output. Don't fork the schema per layer.
- **Slow GitHub work never runs on a request.** Server actions validate (Zod), check `requireRole()`, write Postgres, append an audit event, then emit an Inngest event. GitHub calls happen in Inngest with a per-run installation token.
- **Inngest functions are idempotent** (a retry must never open a duplicate PR). Concurrency is keyed per installation.
- **Tenancy:** every tenant table has `workspace_id` and RLS through `is_workspace_member()`. The service-role key is used only in Inngest functions and webhook handlers, never in a path a user request reaches.
- **Roles are checked twice:** RLS for data, `requireRole()` for intent.
- **Audit:** every mutation writes an audit event (actor, before/after). `policy_versions` and `audit_events` are append-only.
- **Compliance status is derived** by the `repository_status` view. Never store it by hand.
- **Webhooks:** verify the HMAC (`X-Hub-Signature-256`, Stripe signature). Be idempotent on the delivery id.
- **Data minimization:** store repo metadata, the target files' managed blocks and hashes, and policy content. Never other source code. Never store GitHub tokens.
- **Secrets:** only `NEXT_PUBLIC_*` reaches the browser. Keep server-only modules behind `import "server-only"`.
- **UI:** dark by default, light supported. Status always uses the same badges (Compliant, Drifted, Pending sync, Sync failed, Exempted, Disconnected) and is never shown by color alone. Every list has an empty state with one primary action. Keyboard reachable, WCAG AA in both themes.

## Product decisions (resolved open questions)

- One GitHub App for both sign-in and repo access.
- The `CLAUDE.md` target defaults to a **full copy** (not a thin `@AGENTS.md` import).
- Editors can start rollouts **only with admin approval**.
- A ContextOps check run on PRs ships **in v2**.
- The next extra target is likely Cursor rules. Add it as a renderer registry module, not a schema change.
- Brand and domain carry over from v1.
- Out of scope for v2: layered policies (the schema reserves `extends`).

## Commands

| Command                                   | What                                                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                | Web app on :3000                                                                                                                                        |
| `pnpm check`                              | **Fast gate**: format check, lint, typecheck, unit tests (all packages)                                                                                 |
| `pnpm verify`                             | **Full gate**: `check` + seed regen + Supabase migrations/RLS tests + Playwright on a production build. Mirrors CI. Needs Docker; stop `pnpm dev` first |
| `pnpm --filter @contextops/renderer test` | Unit tests for one package (also `@contextops/policy-schema`, `@contextops/web`)                                                                        |
| `pnpm db:start` / `db:reset` / `db:test`  | Local Supabase; re-apply migrations and seed; pgTAP tests                                                                                               |
| `pnpm db:types`                           | Regenerate `server/supabase/database.types.ts` after any migration                                                                                      |
| `pnpm db:seed:generate`                   | Rebuild `supabase/seed.sql` from `server/demo`                                                                                                          |
| `pnpm format`                             | Prettier write                                                                                                                                          |

## Testing workflow

The goal is that a new feature never breaks what already works. Three tiers:

1. **While building (every change):** `pnpm typecheck`, plus the unit tests for the package you touched. Keep this loop under 30 seconds.
2. **Before saying a feature is done:** `pnpm check` must pass.
3. **Before any commit, push or PR:** `pnpm verify` must pass. Report its real result. If you couldn't run it (no Docker, for example), say so explicitly; never imply it passed.

**What each kind of change must add.** Write the test with the code, not after:

| Change                                               | Required tests                                                                                                                                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renderer / policy schema                             | Vitest unit and snapshot tests. Cover: managed-block round trip, content outside markers preserved, first sync into a file without markers, `{{variable}}` fill, each target. Determinism: render twice, assert equal   |
| New table or migration                               | RLS enabled; pgTAP test in `supabase/tests/database/` asserting a workspace-A user sees **zero** workspace-B rows, plus role limits. Then `pnpm db:types` (and `db:seed:generate` if demo data changed)                 |
| Server action                                        | Vitest: Zod rejects bad input, `requireRole()` denies lower roles, audit event written, Inngest event emitted                                                                                                           |
| Inngest / GitHub code                                | Vitest with **MSW** mocking the GitHub API (no live calls in tests). Cover: running twice opens one PR (idempotency), "already compliant" opens no PR, 403/429 backoff, mapping each error to its human-readable reason |
| Webhook handler                                      | Valid signature accepted; invalid or missing signature rejected; duplicate delivery id ignored                                                                                                                          |
| New route or page                                    | Add it to `ROUTES` in `apps/web/e2e/routes.spec.ts` (checks 2xx, no console or hydration errors, no horizontal overflow, both themes, desktop and mobile). Build empty, loading and error states                        |
| Core user flow (sign-up, rollout, drift remediation) | A Playwright flow test in `apps/web/e2e/`                                                                                                                                                                               |
| Bug fix                                              | First a failing test that reproduces the bug, then the fix                                                                                                                                                              |

**Never** skip, delete or loosen a failing test to get green; fix the cause or ask. **Never** update snapshots without reading the diff and confirming the change is intended. Say so when you do.

## Definition of done (any feature)

Typed end to end · tests per the table above · RLS test for any new table · audit event for every mutation · empty, loading and error states · keyboard reachable · works in both themes and on mobile · `pnpm verify` green · `docs/STATUS.md` updated (`/save-context`).

## Git workflow

- One branch per phase (`phase-1`, `phase-2`, …) or feature branch off it. Never commit to `main`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Commit or push only when the user asks. When a chunk is done, offer to commit, push and open a PR into `main`. **The user merges PRs on GitHub.**
- `apps/web/AGENTS.md` is regenerated by `next dev`. Commit it with your work rather than reverting it.

## Build phases

Full detail in the spec's **Build plan**. Current position is in `docs/STATUS.md`.

1. **Shell and data:** every route renders from the database in both themes, mobile and desktop.
2. **Auth and first real PR:** sign up fresh, install the App on a test org, merge a PR that adds `AGENTS.md`.
3. **Rollouts and drift:** a 20-repo rollout completes; a manual `CLAUDE.md` edit flips the repo to Drifted within a minute.
4. **Billing and launch:** a stranger can sign up, pay and sync without talking to us.
