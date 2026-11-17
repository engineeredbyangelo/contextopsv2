# ContextOps v2

Policy-as-code for AI coding agents. The product and technical spec — our source of truth — lives in [docs/spec.md](docs/spec.md).

## Layout

```text
apps/web/                 Next.js app (routes, components, server actions)
  src/app/                routes
  src/components/         ui/ (shadcn), app/ (domain components)
  src/server/             actions, auth guards, Supabase clients
  src/inngest/            job functions: discover, rollout, sync-repo, drift-scan
  src/lib/github/         App auth, Octokit helpers, webhook verification
  e2e/                    Playwright tests
packages/renderer/        pure policy → file rendering + snapshot tests
packages/policy-schema/   Zod schema shared by app and jobs
supabase/migrations/      SQL migrations, RLS, views
supabase/seed.sql         Northwind Labs demo data
docs/                     spec and design notes
```

## Requirements

- Node 22+ (see `.nvmrc`), pnpm 12 (`corepack enable`)
- Docker (for the local Supabase stack)
- Supabase CLI is installed as a dev dependency — use `pnpm exec supabase …`

## Getting started

```bash
pnpm install
pnpm db:start                         # local Postgres, Auth, Studio (Docker)
cp .env.example apps/web/.env.local   # paste the keys db:start prints
pnpm dev                              # http://localhost:3000
```

## Scripts

| Command                                      | What it does                         |
| -------------------------------------------- | ------------------------------------ |
| `pnpm dev`                                   | Run the web app                      |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Checks across all packages           |
| `pnpm format`                                | Prettier                             |
| `pnpm db:reset`                              | Re-apply migrations and seed         |
| `pnpm db:types`                              | Regenerate Supabase TypeScript types |
| `pnpm --filter @contextops/web test:e2e`     | Playwright                           |
