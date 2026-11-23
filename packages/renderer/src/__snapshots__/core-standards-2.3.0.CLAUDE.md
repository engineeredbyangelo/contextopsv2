<!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:27ce8e9d545e669c41b5ac9543d598b144f94acd4ad726ab08ccef92c1808da6" -->
# Claude Code instructions

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

## Claude Code

Use plan mode for changes that touch more than three files.
<!-- contextops:end -->
