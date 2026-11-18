# Build status

_Last updated: 2026-11-18 · branch `phase-1` · last gate: `pnpm verify` passed (60 pgTAP, 19 unit, 108 e2e, 1 intentional skip)_

## Where we are

Phase 1 of 4 (Shell and data) is **done**: every route renders from Supabase, read with the signed-in user's session under RLS, in both themes on desktop and mobile. Verified against the local Docker stack; the hosted project isn't set up yet.

## In progress

- PR #2: https://github.com/engineeredbyangelo/contextopsv2/pull/2. The first CI run failed on intermittent mobile hydration errors (#418); fixed with `useHydrated()` in the sidebar.

## Next steps

1. PR #2 (`phase-1` → `main`) is open. Get CI green; the user merges.
2. When the hosted Supabase project exists: `pnpm exec supabase link`, `pnpm exec supabase db push`, set the env vars in Vercel. Don't run the seed or set `DEMO_SIGN_IN` on production.
3. Start Phase 2 on a `phase-2` branch: register the GitHub App (one App for sign-in and repo access), enable Supabase's GitHub provider with its client credentials, and implement `/auth/callback` with `@supabase/ssr` code exchange, followed by first-sign-in routing to `/onboarding`.
4. Phase 2 continued: workspaces and `create_workspace`, `requireRole()` guard, invites (hash lookup already exists: `invitation_preview`), App install flow with `GET /user/installations` verification, repo discovery, single-repo sync PR.

## Blockers / waiting on

- Hosted Supabase project (blocks step 2 only).

## Decisions not in the spec

- 2026-11-17: The data layer keeps stable signatures; pages call `@/server/data` only.
- 2026-11-18: Session state lives in this file (committed), since a Codespace rebuild can wipe Claude's memory.
- 2026-11-18: Phase 1 sessions come from a **dev-only demo sign-in** (seeded Northwind owner, password login) behind `DEMO_SIGN_IN=true`, so RLS is exercised before GitHub auth. GitHub sign-in replaces it in Phase 2.
- 2026-11-18: The data layer loads the user's whole RLS-visible dataset once per request, and `server/data/views.ts` builds view models from it. Fine at Northwind size; move the audit log and rollout items to paginated queries when tenants grow (PostgREST caps queries at 1000 rows).
- 2026-11-18: Member emails and invite previews go through `security definer` functions (migration `20261118000001_directory.sql`).
- 2026-11-18: Sign-out uses `scope: "local"` (this device only).

## Done recently

- 2026-11-18: Supabase wiring: `server/data/supabase.ts`, `src/proxy.ts`, demo sign-in/out actions, Suspense around `/app` and `/onboarding`.
- 2026-11-18: Tests: `views.test.ts`; pgTAP `directory.test.sql` and generated `seed_status.test.sql`, which checks the view's status for all 24 repos; e2e `auth.setup.ts` + `auth.spec.ts` (guard, `?next=`, open-redirect, sign-out, bad invite).
- 2026-11-18: CI e2e job starts Supabase and writes `.env.local`; the seed check also diffs the generated status test.
- 2026-11-18: Committed the Phase 1 shell; added CLAUDE.md, `pnpm check` / `pnpm verify`, `/save-context`.
- 2026-11-17: Monorepo scaffold merged (PR #1).

## Gotchas found

- `apps/web/AGENTS.md` is rewritten by `next dev`. Commit it rather than reverting it.
- Playwright reuses whatever is on :3000; `pnpm verify` refuses to run while a dev server is up.
- Cache Components: anything that reads the session must be inside `<Suspense>`, or `next build` fails. Check with `NEXT_PUBLIC_SUPABASE_URL= npx next build` (as CI's `check` job builds without env).
- Seed time bombs: the Harbor invite expires 2026-11-20 (the page then shows "expired"; tests still pass). The `infra-terraform` exemption expires 2027-01-31, which will flip its status and fail `seed_status.test.sql`. Move the dates in `server/demo/northwind.ts` before then.
- `pnpm db:reset` kills existing sessions; sign in again afterwards.
- Hydration inside streamed Suspense: a client component in a late boundary sees provider state that changed after the shell hydrated (e.g. `isMobile`). Gate such branches with `useHydrated()` (`src/hooks/use-hydrated.ts`). `components/ui/sidebar.tsx` carries a commented local edit for this. Reproduce with `CI=1 npx playwright test --project=mobile --repeat-each=5`.
