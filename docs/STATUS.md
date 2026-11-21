# Build status

_Last updated: 2026-11-21 · branch `chore/agent-hooks` (merged as PR #4; switch back to `phase-2`) · last gate: `pnpm verify` passed (checker, 2026-11-21, on the uncommitted renderer + landing work: 76 unit, 60 pgTAP, 114 e2e, 1 pre-existing skip; run before the final one-line regex fix in `checker-guard.mjs`)_

## Where we are

Phase 2 of 4 (Auth and first real PR). The pure renderer and a landing-page redesign are written and pass `pnpm verify` but are still uncommitted, waiting on user decisions. Builder/checker rules are now enforced by PreToolUse hooks (PR #4, merged). Auth and GitHub work has not started.

## In progress

All uncommitted in the working tree (currently checked out on `chore/agent-hooks`). No open PRs. Commit as two separate commits (renderer, landing) on `phase-2`.

- **Renderer** (`packages/renderer/src/`: `render.ts`, `managed-block.ts`, `sections.ts`, `hash.ts`, `targets/{agents,claude,copilot}.ts`, `fixtures.ts`, file snapshots in `__snapshots__/`) plus `fillPlaceholders()` in `packages/policy-schema/src/variables.ts`. New dependency `@noble/hashes` (sync SHA-256). Checker rule review: no I/O, `Date` or `Math.random`; snapshots are new, not updated. Deletes `packages/renderer/src/index.test.ts` (the old "is stubbed" test; replaced by 57 new tests) — **needs explicit user OK**. Also `.gitignore`/`.prettierignore` (snapshots, `.claude/worktrees/`).
- **Landing page `/`** (builder): `app/(marketing)/page.tsx`, `globals.css` (`co-type`/`co-dash`/`co-pulse` keyframes, reduced-motion off), `lib/sample.ts`, `components/marketing/*` (hero `policy-to-files`, `product-demo`, `managed-block-demo`, `how-it-works`, `trust-strip`, `browser-frame`, `in-view`, `use-motion`), new `e2e/landing.spec.ts`. Passed checker in 2 rounds on 2026-11-20 and again in `pnpm verify` on 2026-11-21.

## Next steps

1. `git switch phase-2 && git merge origin/main` (brings in PR #4; the uncommitted work carries over, since PR #4 touches no file that is modified locally except `docs/STATUS.md`, which is identical on both branches before this edit).
2. Get the user's answers to the Blockers below (deleted test, landing copy). If copy changes, builder edits and checker re-runs `pnpm verify`.
3. Commit as two commits (`feat(renderer): …`, `feat(web): redesign landing page`), then offer push + PR into `main`.
4. **`/auth/callback`:** replace the stub in `apps/web/src/app/auth/callback/route.ts` with the `@supabase/ssr` code exchange. First sign-in goes to `/onboarding`, returning users to their last workspace. "Continue with GitHub" on `/login`; demo sign-in stays behind `DEMO_SIGN_IN`.
5. **Workspaces and roles:** onboarding step 1 calls `create_workspace`; `requireRole()` in `src/server/auth/`; server actions validate with Zod, call `log_audit_event`, emit Inngest events.
6. **GitHub App + sign-in (needs user):** register the App (spec → "GitHub App permissions"), enable Supabase GitHub provider (`supabase/config.toml` `[auth.external.github]`). Secrets only in `apps/web/.env.local`.
7. **Invites:** `/invite/[token]` accept flow (`invitation_preview` exists). Signed, single-use, 7-day tokens; sets `accepted_at`.
8. **App install flow:** setup URL callback, `GET /user/installations`, save `github_installations`, discard user token, queue discovery (Inngest). "Waiting for org approval" state.
9. **Repo discovery + single-repo sync PR:** Inngest with installation tokens using the renderer's `applyManagedBlock`/`isAlreadyCompliant`; webhooks with HMAC + delivery-id idempotency; MSW tests. Done when a fresh account installs the App on a test org and merges a PR adding `AGENTS.md`.
10. Hosted Supabase when it exists: `supabase link`, `db push`, Vercel env. Never seed it or set `DEMO_SIGN_IN`.

## Blockers / waiting on

- **Deleted test (user):** accept removing `packages/renderer/src/index.test.ts` (stub-throws test, obsolete now that `render()` exists)? Orchestrator recommends yes.
- **Landing copy decisions (user):** (a) the final CTA says "Sign in with GitHub, install the App…" but GitHub sign-in isn't live; soften it? (b) the demo shows `mobile-app` reaching Compliant, but it's Sync failed in the seed; PR numbers and the v2.2.0 hash are invented. (c) Hero hashes come from the renderer snapshots and go stale if the output changes.
- Should the landing work move to its own branch before committing? (Offered; no answer yet.)
- **GitHub App registration** and a **test GitHub org** (user), for step 6 onward.
- Hosted Supabase project (step 10 only).

## Decisions not in the spec

- 2026-11-21: Builder/checker rules are enforced by PreToolUse hooks in agent frontmatter (`.claude/hooks/{builder,checker}-guard.mjs`), not just prompts. Builder can't edit `.claude/`, so hook changes are made by the orchestrator.
- 2026-11-21: Checker `PASS` requires a clean rule review of `git diff main...HEAD` as well as green gates.
- 2026-11-20: Landing redesign pulled forward from Phase 4 at the user's request; built on `phase-2` and committed separately from the renderer.
- 2026-11-20: Landing visuals use CSS keyframes + IntersectionObserver, no animation library. The server render is the finished frame, which is also what reduced motion and no-JS visitors see.
- 2026-11-20: Landing sample data is copied into `lib/sample.ts`, so client components never import `server/demo`.
- 2026-11-18: Session state lives in this file (committed), since a Codespace rebuild can wipe Claude's memory.
- 2026-11-18: Dev-only demo sign-in (seeded Northwind owner) behind `DEMO_SIGN_IN=true`.
- 2026-11-18: Data layer loads the whole RLS-visible dataset once per request; paginate the audit log and rollout items when tenants grow (PostgREST 1000-row cap).
- 2026-11-18: Member emails and invite previews go through `security definer` functions (`20261118000001_directory.sql`).
- 2026-11-18: Sign-out uses `scope: "local"`.
- 2026-11-18: Code is written only by **builder** and verified only by **checker**; at most 3 fix rounds per slice.
- 2026-11-18: `pnpm verify` never modifies tracked files.

## Done recently

- 2026-11-21: PR #4 merged: PreToolUse hooks for builder/checker, checker rule review, builder report lists changed tests and new deps. Hook confirmed firing inside a real checker run.
- 2026-11-21: Fixed the checker redirect rule so `> /tmp/…` and `>> /tmp/…` are allowed (amended into PR #4).
- 2026-11-21: `pnpm verify` passed via checker on the uncommitted renderer + landing work.
- 2026-11-20: Builder/checker loop trialled for real: checker report format and before/after `git status` check work.
- 2026-11-20: Renderer + `fillPlaceholders` and the landing redesign written; landing passed checker in 2 rounds.
- 2026-11-18: PR #3 merged: builder/checker agents, loop in CLAUDE.md, lean `verify.sh`.
- 2026-11-18: PR #2 merged: Phase 1 complete, CI green incl. Supabase e2e.
- 2026-11-18: Supabase wiring: `server/data/supabase.ts`, `src/proxy.ts`, demo sign-in/out, Suspense around `/app` and `/onboarding`.
- 2026-11-17: Monorepo scaffold merged (PR #1).

## Gotchas found

- Checker hook treats any `>` as a redirect, even inside quotes (`grep "==>"`), and blocks it. Use `>/tmp/…` or `> /tmp/…` for logs; avoid `>` in patterns.
- Builder hook blocks any edit whose new text contains `eslint-disable`/`@ts-ignore`, even if it was already there. Builder should flag it instead.
- Run checker with `CI=true` for vitest so a missing snapshot fails instead of being written.
- When builder and checker run at the same time, scope checker to packages builder isn't touching (repo-wide format/lint/typecheck would see half-written files).
- `apps/web/AGENTS.md` is rewritten by `next dev`. Commit it rather than reverting it.
- Playwright reuses whatever is on :3000; `pnpm verify` refuses to run while a dev server is up.
- Cache Components: anything reading the session must be inside `<Suspense>`, or `next build` fails. Check with `NEXT_PUBLIC_SUPABASE_URL= npx next build`.
- 2-core Codespace: the full Supabase stack + production build + Playwright runs out of memory. `verify.sh` starts the lean stack; `pnpm db:stop` first if the full stack is up.
- Hydration inside streamed Suspense: gate late client components with `useHydrated()` (`src/hooks/use-hydrated.ts`). Reproduce with `CI=1 npx playwright test --project=mobile --repeat-each=5`.
- `supabase-js` logs harmless `Date.now()` "blocking prerender" errors (`__loadSession`) on signed-in routes during e2e (~105 lines per verify run); none on `/`.
- Don't run `/save-context` while checker is running: checker's before/after `git status` flags the STATUS.md edit.
- Seed time bombs: the Harbor invite shows as expired from 2026-11-20 (tests still pass). The `infra-terraform` exemption expires **2027-01-31** and will fail `seed_status.test.sql`. Move dates in `server/demo/northwind.ts` before then.
- `pnpm db:reset` kills existing sessions; sign in again afterwards.
