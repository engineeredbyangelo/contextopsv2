# Build status

_Last updated: 2026-11-18 · branch `phase-1` · last gate: `pnpm check` passed (`pnpm verify` not yet run)_

## Where we are

Phase 1 of 4: Shell and data. The UI, routes, schema, RLS and seed are built. Pages still read the Northwind demo dataset through `apps/web/src/server/data` (`demo.ts`) because the hosted Supabase project isn't ready yet.

## In progress

- All Phase 1 work on `phase-1` is **uncommitted**: routes, domain components, migrations `20261117000001`–`08`, `supabase/tests/database/rls.test.sql`, `e2e/routes.spec.ts` and `scripts/generate-seed.ts`.
- Testing workflow added: `pnpm check` (fast gate), `pnpm verify` (full CI-equivalent, `scripts/verify.sh`), the `/save-context` skill, and the root `CLAUDE.md`.

## Next steps

1. Run `pnpm verify` and fix anything it finds.
2. Commit the Phase 1 work on `phase-1`, push it, and open a PR into `main` (the user merges).
3. When the hosted Supabase project exists: run `pnpm exec supabase link`, then add a Supabase-backed module next to `server/data/demo.ts` with the same signatures and switch `server/data/index.ts` to it. Phase 1 is done when every route renders from the database.
4. Start Phase 2: GitHub sign-in through Supabase Auth, workspaces, roles and invites.

## Blockers / waiting on

- Hosted Supabase instance (blocks the step 3 wiring only; local Docker Supabase works for migrations and RLS tests).

## Decisions not in the spec

- 2026-11-17: Phase 1 ships with the data layer still on demo data. The functions have the same signatures they will have on Supabase, so wiring swaps one module.
- 2026-11-18: Session state lives in this file (committed), not in Claude's private memory, which a Codespace rebuild can wipe.

## Done recently

- 2026-11-17: Monorepo scaffold merged (PR #1). CI jobs: check, database, e2e.
- 2026-11-17: Phase 1 shell: all routes, sidebar, ⌘K, themes, schema, RLS, Northwind seed.

## Gotchas found

- `apps/web/AGENTS.md` is rewritten by `next dev`. Commit it with your work rather than reverting it.
- Playwright reuses whatever is on :3000. If a dev server is running, e2e skips the production build; `pnpm verify` refuses to run until it's stopped.
