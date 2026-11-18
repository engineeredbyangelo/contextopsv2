---
name: save-context
description: Save where the ContextOps build stands and what to do next into docs/STATUS.md, so the next session picks up exactly here. Use when the user runs /save-context, says "save context", "checkpoint", "wrap up the session", or before ending a long working session.
---

# Save context

Update `docs/STATUS.md` so a fresh session (no memory of this one) can resume work in under a minute. It is the single source of truth for build progress; CLAUDE.md tells every session to read it first.

## Steps

1. **Gather facts. Don't rely on recall alone.**
   - `git branch --show-current`, `git status --short`, `git log --oneline -10`, `git log origin/main..HEAD --oneline` (if the remote exists).
   - `gh pr list --head "$(git branch --show-current)" --json number,title,state,url` if `gh` is available.
   - Read the current `docs/STATUS.md` and the **Build plan** section of `docs/spec.md`.
   - Note the last gate you actually ran this session (`pnpm check` / `pnpm verify`) and its result. If neither ran, say "not run this session". Never claim a pass you didn't see.

2. **Rewrite `docs/STATUS.md`** using exactly the template below. Rules:
   - Use absolute dates (YYYY-MM-DD). Today's date goes in _Last updated_.
   - Be specific: file paths, route names, function names, PR numbers. "Wired repositories list to Supabase (`server/data/supabase.ts`)" beats "worked on data layer".
   - **Next steps** is an ordered list of concrete actions. The first item should be startable without asking anything.
   - Move finished _Next steps_ into _Done recently_. Keep _Done recently_ to about the last 10 items; older history lives in git.
   - Record decisions that aren't in the spec and the reason for each (one line each). If a decision changes the spec, say so and offer to update `docs/spec.md`.
   - Keep the whole file under about 120 lines. Trim; don't append forever.

3. **Show the user a short summary** of what changed in the file. Then **ask** whether to commit it (`docs: update status`) to the current branch. Never commit on `main`, and never push without being asked.

## Template

```markdown
# Build status

_Last updated: YYYY-MM-DD · branch `…` · last gate: `pnpm verify` passed | `pnpm check` passed | failing: … | not run this session_

## Where we are

Phase N of 4: <phase name>. One or two sentences on the current state.

## In progress

- What's mid-flight, with file paths. Uncommitted work and open PRs (#n, url).

## Next steps

1. …
2. …

## Blockers / waiting on

- … (or "None")

## Decisions not in the spec

- YYYY-MM-DD: decision, and why.

## Done recently

- YYYY-MM-DD: …

## Gotchas found

- Things that cost time and will again (env, tooling, flaky tests).
```
