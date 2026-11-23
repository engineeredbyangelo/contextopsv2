import { policyContentSchema, type PolicyContentInput } from "@contextops/policy-schema";
import type { PolicyVersionInput } from "./render";

/**
 * Test fixtures modelled on the Northwind demo workspace
 * (apps/web/src/server/demo/content.ts, "core-standards" 2.3.0). Copied rather than imported:
 * packages never depend on the app.
 */
export const coreStandardsContent: PolicyContentInput = {
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
    { rule: "Prefer explicit return types on exported functions.", severity: "should" },
  ],
  security: {
    secrets: "Read secrets from environment variables only. Never log them.",
    forbiddenPaths: [".env*", "**/*.pem", "infra/secrets/**"],
    dependencies: "Ask before adding a new runtime dependency.",
  },
  pullRequests: {
    branchNaming: "type/short-description, e.g. fix/login-redirect",
    commitStyle: "conventional",
    checklist: ["Tests pass locally", "No unrelated changes", "Screenshots for UI changes"],
  },
  overrides: {
    claude: { append: "Use plan mode for changes that touch more than three files." },
    copilot: { append: "Suggest tests alongside implementation changes." },
  },
};

export function policyVersion(
  content: PolicyContentInput = coreStandardsContent,
  version = "2.3.0",
  slug = "core-standards",
): PolicyVersionInput {
  return { slug, version, content: policyContentSchema.parse(content) };
}

export const pnpmVars = { packageManager: "pnpm", nodeVersion: "22" };
export const npmVars = { packageManager: "npm", nodeVersion: "22" };
