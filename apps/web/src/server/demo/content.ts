import type { PolicyContentInput } from "@contextops/policy-schema";

/** Policy content for the Northwind Labs demo workspace, one entry per published version. */

const coreBase: PolicyContentInput = {
  overview: {
    summary:
      "Engineering standards every Northwind Labs and client repository follows. Agents should read this before making changes.",
    stack: ["TypeScript", "Node.js", "GitHub Actions"],
  },
  commands: {
    install: "{{packageManager}} install",
    test: "{{packageManager}} test",
    lint: "{{packageManager}} run lint",
    typecheck: "{{packageManager}} run typecheck",
    build: "{{packageManager}} run build",
  },
  codingStandards: [
    { rule: "Keep functions small and named for what they return.", severity: "should" },
    { rule: "Never commit secrets, tokens or .env files.", severity: "must" },
    { rule: "Add or update tests for every behavior change.", severity: "must" },
  ],
  security: {
    secrets: "Read secrets from environment variables only. Never log them.",
    forbiddenPaths: [".env*", "**/*.pem"],
    dependencies: "Ask before adding a new runtime dependency.",
  },
  pullRequests: {
    branchNaming: "type/short-description, e.g. fix/login-redirect",
    commitStyle: "conventional",
    checklist: ["Tests pass locally", "No unrelated changes"],
  },
};

const core22: PolicyContentInput = {
  ...coreBase,
  codingStandards: [
    ...coreBase.codingStandards!,
    { rule: "Prefer explicit return types on exported functions.", severity: "should" },
  ],
  pullRequests: {
    ...coreBase.pullRequests,
    checklist: ["Tests pass locally", "No unrelated changes", "Screenshots for UI changes"],
  },
};

const core23: PolicyContentInput = {
  ...core22,
  security: {
    ...core22.security,
    forbiddenPaths: [".env*", "**/*.pem", "infra/secrets/**"],
  },
  overrides: {
    claude: { append: "Use plan mode for changes that touch more than three files." },
    copilot: { append: "Suggest tests alongside implementation changes." },
  },
};

const coreDraft: PolicyContentInput = {
  ...core23,
  codingStandards: [
    ...core23.codingStandards!,
    { rule: "Log with the shared logger, never console.log in committed code.", severity: "must" },
  ],
};

const nextBase: PolicyContentInput = {
  overview: {
    summary: "Conventions for Next.js App Router projects backed by Supabase.",
    stack: ["Next.js", "React", "Supabase", "Tailwind CSS"],
  },
  commands: {
    install: "{{packageManager}} install",
    dev: "{{packageManager}} dev",
    test: "{{packageManager}} test",
    lint: "{{packageManager}} lint",
    typecheck: "{{packageManager}} typecheck",
    build: "{{packageManager}} build",
  },
  codingStandards: [
    { rule: "Default to Server Components; add 'use client' only when needed.", severity: "must" },
    { rule: "Validate every server action input with Zod.", severity: "must" },
    { rule: "Query Supabase with the user's session so RLS applies.", severity: "must" },
  ],
  security: {
    secrets: "Only NEXT_PUBLIC_ variables may reach the browser.",
    forbiddenPaths: [".env*", "supabase/.temp/**"],
  },
  pullRequests: {
    commitStyle: "conventional",
    checklist: ["Migrations included", "Types regenerated"],
  },
  overrides: {
    claude: { mode: "full", append: "Run the typecheck before declaring a task done." },
  },
};

const next11: PolicyContentInput = {
  ...nextBase,
  codingStandards: [
    ...nextBase.codingStandards!,
    { rule: "Wrap uncached data reads in Suspense with a skeleton fallback.", severity: "should" },
  ],
};

const python10: PolicyContentInput = {
  overview: {
    summary: "Standards for Python services and data pipelines.",
    stack: ["Python 3.13", "uv", "pytest", "ruff"],
  },
  commands: {
    install: "uv sync",
    test: "uv run pytest",
    lint: "uv run ruff check .",
    typecheck: "uv run mypy .",
  },
  codingStandards: [
    { rule: "Type-annotate all public functions.", severity: "must" },
    { rule: "Use pathlib over os.path.", severity: "should" },
  ],
  security: { forbiddenPaths: [".env*", "data/raw/**"] },
  pullRequests: { commitStyle: "conventional", checklist: ["pytest passes", "ruff clean"] },
};

export const POLICY_CONTENT: Record<
  "core-standards" | "nextjs-supabase" | "python-service",
  Record<string, PolicyContentInput>
> = {
  "core-standards": { "2.1.0": coreBase, "2.2.0": core22, "2.3.0": core23, draft: coreDraft },
  "nextjs-supabase": { "1.0.0": nextBase, "1.1.0": next11 },
  "python-service": { "1.0.0": python10 },
};

/** Drift diffs shown on the repository page for the three drifted demo repos. */
export const DRIFT_DIFFS: Record<string, string> = {
  "billing-service": `diff --git a/CLAUDE.md b/CLAUDE.md
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -12,6 +12,7 @@
 ## Commands
 
 - Install: \`pnpm install\`
-- Test: \`pnpm test\`
+- Test: \`pnpm test --runInBand\`
+- Never run the e2e suite locally; it hits the staging Stripe account.
 - Lint: \`pnpm run lint\`
 - Typecheck: \`pnpm run typecheck\`
`,
  "ml-models": `diff --git a/AGENTS.md b/AGENTS.md
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -20,5 +20,5 @@
 ## Security
 
 Never read or write these paths:
-- \`.env*\`
-- \`data/raw/**\`
+- \`.env*\`
+- \`data/raw/**\` (except data/raw/samples)
`,
  "harbor-dashboard": `diff --git a/.github/copilot-instructions.md b/.github/copilot-instructions.md
--- a/.github/copilot-instructions.md
+++ b/.github/copilot-instructions.md
@@ -8,6 +8,5 @@
 ## Coding standards
 
 - **Must:** Default to Server Components; add 'use client' only when needed.
-- **Must:** Validate every server action input with Zod.
 - **Must:** Query Supabase with the user's session so RLS applies.
 
`,
};
