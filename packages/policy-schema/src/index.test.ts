import { describe, expect, it } from "vitest";
import {
  bumpSemver,
  compareSemver,
  findPlaceholders,
  isTargetId,
  policyContentSchema,
  repoVariablesSchema,
  targetsSchema,
} from "./index";

describe("policyContentSchema", () => {
  it("applies defaults to a minimal policy", () => {
    const parsed = policyContentSchema.parse({ overview: { summary: "Next.js app" } });
    expect(parsed.overview.stack).toEqual([]);
    expect(parsed.codingStandards).toEqual([]);
    expect(parsed.security.forbiddenPaths).toEqual([]);
    expect(parsed.pullRequests.commitStyle).toBe("conventional");
    expect(parsed.overrides).toEqual({});
  });

  it("defaults the Claude override to a full copy", () => {
    const parsed = policyContentSchema.parse({
      overview: { summary: "x" },
      overrides: { claude: { append: "Use plan mode." } },
    });
    expect(parsed.overrides.claude?.mode).toBe("full");
  });

  it("rejects an empty summary and invalid severities", () => {
    expect(policyContentSchema.safeParse({ overview: { summary: " " } }).success).toBe(false);
    expect(
      policyContentSchema.safeParse({
        overview: { summary: "x" },
        codingStandards: [{ rule: "No any", severity: "could" }],
      }).success,
    ).toBe(false);
  });

  it("reserves `extends` for layered policies", () => {
    expect(
      policyContentSchema.safeParse({ overview: { summary: "x" }, extends: "base" }).success,
    ).toBe(false);
  });
});

describe("targets", () => {
  it("accepts known targets only", () => {
    expect(targetsSchema.safeParse(["agents", "claude"]).success).toBe(true);
    expect(targetsSchema.safeParse(["cursor"]).success).toBe(false);
    expect(targetsSchema.safeParse([]).success).toBe(false);
    expect(isTargetId("copilot")).toBe(true);
    expect(isTargetId("toString")).toBe(false);
  });
});

describe("semver", () => {
  it("bumps versions", () => {
    expect(bumpSemver("2.3.0", "patch")).toBe("2.3.1");
    expect(bumpSemver("2.3.4", "minor")).toBe("2.4.0");
    expect(bumpSemver("2.3.4", "major")).toBe("3.0.0");
    expect(bumpSemver(null, "major")).toBe("1.0.0");
  });

  it("compares numerically, not lexically", () => {
    expect(compareSemver("2.10.0", "2.9.0")).toBeGreaterThan(0);
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
  });
});

describe("variables", () => {
  it("finds placeholders across nested content", () => {
    expect(
      findPlaceholders({
        commands: { install: "{{packageManager}} install", test: "{{ testCommand }}" },
        list: ["node {{nodeVersion}}", "{{packageManager}}"],
      }),
    ).toEqual(["nodeVersion", "packageManager", "testCommand"]);
  });

  it("validates variable names", () => {
    expect(repoVariablesSchema.safeParse({ packageManager: "pnpm" }).success).toBe(true);
    expect(repoVariablesSchema.safeParse({ "package-manager": "pnpm" }).success).toBe(false);
  });
});

import { diffPolicySections } from "./diff";

describe("diffPolicySections", () => {
  const base = policyContentSchema.parse({
    overview: { summary: "x", stack: ["Next.js"] },
    commands: { test: "pnpm test", lint: "pnpm lint" },
  });

  it("reports nothing for identical content, regardless of key order", () => {
    const reordered = policyContentSchema.parse({
      commands: { lint: "pnpm lint", test: "pnpm test" },
      overview: { stack: ["Next.js"], summary: "x" },
    });
    expect(diffPolicySections(base, reordered)).toEqual([]);
  });

  it("classifies added, changed and removed sections in display order", () => {
    const next = policyContentSchema.parse({
      overview: { summary: "y", stack: ["Next.js"] },
      codingStandards: [{ rule: "No any", severity: "must" }],
      freeform: "Notes",
    });
    expect(diffPolicySections(base, next).map((c) => [c.section, c.change])).toEqual([
      ["overview", "changed"],
      ["commands", "removed"],
      ["codingStandards", "added"],
      ["freeform", "added"],
    ]);
  });
});
