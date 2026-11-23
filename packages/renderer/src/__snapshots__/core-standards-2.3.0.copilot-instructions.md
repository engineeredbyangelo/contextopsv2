<!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:0d9936d95e2650e13533c3882aafd71409cae5e5592a5ce8299e5bfa51d3915b" -->
# Copilot instructions

Engineering standards every Northwind Labs and client repository follows. Agents should read this before making changes.

**Stack:** TypeScript, Node.js, GitHub Actions

## Commands

- Install: `pnpm install`
- Test: `pnpm test`
- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Build: `pnpm run build`

## Coding standards

- **Should:** Keep functions small and named for what they return.
- **Must:** Never commit secrets, tokens or .env files.
- **Must:** Add or update tests for every behavior change.
- **Should:** Prefer explicit return types on exported functions.

## Security

Read secrets from environment variables only. Never log them.

Never read or write these paths:
- `.env*`
- `**/*.pem`
- `infra/secrets/**`

Ask before adding a new runtime dependency.

## Pull requests

- Branch naming: type/short-description, e.g. fix/login-redirect
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …)

Before opening a pull request, check:
- Tests pass locally
- No unrelated changes
- Screenshots for UI changes

## GitHub Copilot

Suggest tests alongside implementation changes.
<!-- contextops:end -->
