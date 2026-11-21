# Build status

_Last updated: 2026-11-18 · branch `phase-2` (fresh from `main` @ `402891d`) · last gate: `pnpm verify` passed (60 pgTAP, 19 unit, 108 e2e, 1 intentional skip) on the code now in `main`_

## Where we are

Phase 1 of 4 (Shell and data) is **done and merged**. Every route renders from Supabase, read with the signed-in user's session under RLS (PR #2). The **builder** and **checker** agents and the build loop are merged too (PR #3). Phase 2 (Auth and first real PR) starts now on `phase-2`.

## In progress

- Nothing mid-flight. Branch `phase-2` has only this status update. No open PRs.

## Next steps

All Phase 2 work goes through the **builder → checker** loop (CLAUDE.md → "Build agents and the loop").

1. **Trial the loop:** have **checker** run `pnpm check` on `phase-2` and confirm its report format and before/after `git status` check. The agents have never run yet.
2. **GitHub App + sign-in (needs the user):** the user registers the ContextOps GitHub App (one App for sign-in and repo access; permissions and webhook events in spec → "GitHub App permissions"). Then enable Supabase Auth's GitHub provider with the App's client ID and secret (`supabase/config.toml` `[auth.external.github]` locally). Secrets go in `apps/web/.env.local` only, never in chat.
3. **`/auth/callback`:** replace the stub in `apps/web/src/app/auth/callback/route.ts` with the `@supabase/ssr` code exchange. On first sign-in, route to `/onboarding`; returning users go to their last workspace. Add "Continue with GitHub" to `/login` (replacing the `PendingButton`) and keep the demo sign-in behind `DEMO_SIGN_IN`.
4. **Workspaces and roles:** onboarding step 1 calls `create_workspace`; add a `requireRole()` guard in `src/server/auth/` used by every server action; server actions validate with Zod, write an audit event (`log_audit_event`) and emit Inngest events.
5. **Invites:** `/invite/[token]` accept flow (lookup already exists: `invitation_preview`). Signed, single-use, 7-day tokens. Joining sets `accepted_at`.
6. **App install flow:** setup URL callback exchanges `code`, verifies with `GET /user/installations`, saves `github_installations`, discards the user token, and queues repo discovery (Inngest). Handle the "waiting for org approval" state.
7. **Repo discovery + single-repo sync PR:** Inngest functions with installation tokens, webhooks with HMAC verification and delivery-id idempotency, all tested with MSW. Phase 2 is done when a fresh account installs the App on a test org and merges a PR that adds `AGENTS.md`.
8. Hosted Supabase, whenever it exists: `pnpm exec supabase link`, `pnpm exec supabase db push`, env vars in Vercel. Never seed it or set `DEMO_SIGN_IN` there.

## Blockers / waiting on

- **GitHub App registration** and a **test GitHub org** (user): needed for step 2 onward. Steps 1, 3 (code) and 4 can start before them.
- Hosted Supabase project (blocks step 8 only).

## Decisions not in the spec

- 2026-11-17: The data layer keeps stable signatures; pages call `@/server/data` only.
- 2026-11-18: Session state lives in this file (committed), since a Codespace rebuild can wipe Claude's memory.
- 2026-11-18: Phase 1 sessions come from a **dev-only demo sign-in** (seeded Northwind owner) behind `DEMO_SIGN_IN=true`. GitHub sign-in sits beside it in Phase 2.
- 2026-11-18: The data layer loads the user's whole RLS-visible dataset once per request; `server/data/views.ts` builds view models. Move the audit log and rollout items to paginated queries when tenants grow (PostgREST caps queries at 1000 rows).
- 2026-11-18: Member emails and invite previews go through `security definer` functions (`20261118000001_directory.sql`).
- 2026-11-18: Sign-out uses `scope: "local"` (this device only).
- 2026-11-18: Code is written only by **builder** and verified only by **checker**. The orchestrator gets at most 3 fix rounds per slice, then escalates to the user.
- 2026-11-18: `pnpm verify` never modifies tracked files. The seed check compares, restores and fails instead of regenerating.

## Done recently

- 2026-11-18: PR #3 merged: builder/checker agents (`.claude/agents/`), the loop in CLAUDE.md, read-only and lean `verify.sh`. CI green.
- 2026-11-18: PR #2 merged: Phase 1 complete. CI green, including the Supabase-backed e2e job.
- 2026-11-18: Fixed intermittent mobile hydration mismatch (#418) in the streamed sidebar with `useHydrated()`.
- 2026-11-18: Supabase wiring: `server/data/supabase.ts`, `src/proxy.ts`, demo sign-in/out, Suspense around `/app` and `/onboarding`.
- 2026-11-18: Tests: `views.test.ts`; pgTAP `directory.test.sql` and generated `seed_status.test.sql`; e2e `auth.setup.ts` + `auth.spec.ts`.
- 2026-11-18: CLAUDE.md, `pnpm check` / `pnpm verify`, `/save-context`.
- 2026-11-17: Monorepo scaffold merged (PR #1).

## Gotchas found

- `builder` and `checker` showed up in the session that created them only after a while. A fresh session loads them right away.
- `apps/web/AGENTS.md` is rewritten by `next dev`. Commit it rather than reverting it.
- Playwright reuses whatever is on :3000; `pnpm verify` refuses to run while a dev server is up.
- Cache Components: anything that reads the session must be inside `<Suspense>`, or `next build` fails. Check with `NEXT_PUBLIC_SUPABASE_URL= npx next build` (CI's `check` job builds without env).
- 2-core Codespace: the **full** Supabase stack plus a production build and Playwright runs out of memory (browser crashes, false e2e failures). `verify.sh` starts the lean CI stack. If the full stack (`pnpm db:start`) is up, `pnpm db:stop` first.
- Hydration inside streamed Suspense: client components in a late boundary see provider state changed after the shell hydrated. Gate with `useHydrated()` (`src/hooks/use-hydrated.ts`). `components/ui/sidebar.tsx` carries a commented local edit. Reproduce with `CI=1 npx playwright test --project=mobile --repeat-each=5`.
- `supabase-js` logs `Date.now()` "blocking prerender" errors from `__loadSession` during e2e. It's harmless noise for now; revisit if it ever fails a test.
- Seed time bombs: the Harbor invite expired view shows from 2026-11-20 (tests still pass). The `infra-terraform` exemption expires **2027-01-31** and will fail `seed_status.test.sql`. Move the dates in `server/demo/northwind.ts` before then.
- `pnpm db:reset` kills existing sessions; sign in again afterwards.
