#!/usr/bin/env bash
# Full local gate: mirrors every CI job (check, database, e2e). Run before any commit or PR.
# Never modifies tracked files.
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
# Check-only: regenerate, compare, then put the committed files back. verify never
# modifies tracked files (the Checker agent runs it and must stay read-only).
seed_files=(supabase/seed.sql supabase/tests/database/seed_status.test.sql)
backup=$(mktemp -d)
for f in "${seed_files[@]}"; do cp "$f" "$backup/$(basename "$f")"; done
pnpm db:seed:generate >/dev/null
stale=()
for f in "${seed_files[@]}"; do
  cmp -s "$f" "$backup/$(basename "$f")" || stale+=("$f")
  cp "$backup/$(basename "$f")" "$f"
done
rm -rf "$backup"
if [ ${#stale[@]} -gt 0 ]; then
  echo "Stale generated files: ${stale[*]}. Run \`pnpm db:seed:generate\` and commit the result." >&2
  exit 1
fi

step "Database: migrations, seed, pgTAP tests (starts the local stack if needed)"
if ! pnpm exec supabase status >/dev/null 2>&1; then
  # Same lean stack as CI (Postgres, Auth, PostgREST, Kong). The full stack plus a
  # production build and Playwright exhausts a 2-core Codespace.
  pnpm exec supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
fi
pnpm db:reset
pnpm db:test

step "E2E: production build, every route, both themes, desktop and mobile"
pnpm --filter @contextops/web test:e2e

printf '\n\033[1;32mAll gates passed.\033[0m\n'
