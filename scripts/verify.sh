#!/usr/bin/env bash
# Full local gate: mirrors every CI job (check, database, e2e). Run before any commit or PR.
# Fast gate only: `pnpm check`.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

if (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
  echo "Port 3000 is in use. Stop your dev server first: Playwright would reuse it and skip the production build." >&2
  exit 1
fi

step "Fast gate: format, lint, typecheck, unit tests"
pnpm check

step "Seed matches the demo dataset"
before=$(sha256sum supabase/seed.sql | cut -d' ' -f1)
pnpm db:seed:generate
after=$(sha256sum supabase/seed.sql | cut -d' ' -f1)
if [ "$before" != "$after" ]; then
  echo "supabase/seed.sql was stale and has been regenerated. Include it in your commit (CI diffs it)."
fi

step "Database: migrations, seed, pgTAP tests (starts the local stack if needed)"
if ! pnpm exec supabase status >/dev/null 2>&1; then
  pnpm exec supabase start
fi
pnpm db:reset
pnpm db:test

step "E2E: production build, every route, both themes, desktop and mobile"
pnpm --filter @contextops/web test:e2e

printf '\n\033[1;32mAll gates passed.\033[0m\n'
