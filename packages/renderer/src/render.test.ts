import { describe, expect, it } from "vitest";
import { TARGET_IDS, TARGETS, type TargetId } from "@contextops/policy-schema";
import { coreStandardsContent, npmVars, pnpmVars, policyVersion } from "./fixtures";
import { parseManagedBlock, sha256Hex, render, renderTarget, TARGET_RENDERERS } from "./index";

/**
 * File snapshots in ./__snapshots__ were written and reviewed by hand (hashes from `sha256sum`
 * over the body). They are the format spec: a change to them must be read, not regenerated.
 */
const SNAPSHOT_NAME: Record<TargetId, string> = {
  agents: "AGENTS.md",
  claude: "CLAUDE.md",
  copilot: "copilot-instructions.md",
};

describe("render: each target", () => {
  for (const target of TARGET_IDS) {
    it(`renders ${TARGETS[target].path} for core-standards 2.3.0`, async () => {
      await expect(`${render(policyVersion(), pnpmVars, target)}\n`).toMatchFileSnapshot(
        `./__snapshots__/core-standards-2.3.0.${SNAPSHOT_NAME[target]}`,
      );
    });
  }

  it("registers a renderer for every schema target, at the schema's path", () => {
    expect(Object.keys(TARGET_RENDERERS).sort()).toEqual([...TARGET_IDS].sort());
    for (const id of TARGET_IDS) {
      expect(TARGET_RENDERERS[id].id).toBe(id);
      expect(renderTarget(policyVersion(), pnpmVars, id).path).toBe(TARGETS[id].path);
    }
  });

  it("wraps the body in markers whose hash is the body's sha256", () => {
    const result = renderTarget(policyVersion(), pnpmVars, "agents");
    expect(result.hash).toBe(sha256Hex(result.body));
    expect(result.block).toBe(
      `<!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:${result.hash}" -->\n${result.body}\n<!-- contextops:end -->`,
    );
    expect(result.block.endsWith("\n")).toBe(false);
  });

  it("puts each target's override only in that target", () => {
    const claude = render(policyVersion(), pnpmVars, "claude");
    const copilot = render(policyVersion(), pnpmVars, "copilot");
    const agents = render(policyVersion(), pnpmVars, "agents");
    expect(claude).toContain("Use plan mode");
    expect(copilot).not.toContain("Use plan mode");
    expect(agents).not.toContain("Use plan mode");
    expect(copilot).toContain("Suggest tests alongside");
    expect(claude).not.toContain("Suggest tests alongside");
  });

  it("renders an AGENTS.md override under its own heading", () => {
    const body = renderTarget(
      policyVersion({ overview: { summary: "x" }, overrides: { agents: { append: "Be brief." } } }),
      {},
      "agents",
    ).body;
    // commitStyle defaults to conventional, so the shared Pull requests section renders first;
    // the override comes after every shared section, under its own heading.
    expect(body).toBe(
      "# Agent instructions\n\nx\n\n## Pull requests\n\n- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …)\n\n## Agent notes\n\nBe brief.",
    );
  });
});

describe("render: CLAUDE.md mode", () => {
  it("defaults to a full copy, not an @AGENTS.md import", () => {
    const { body } = renderTarget(policyVersion(), pnpmVars, "claude");
    expect(body).not.toContain("@AGENTS.md");
    expect(body).toContain("## Commands");
    expect(body).toContain("## Coding standards");
  });

  it("renders a thin import file when the policy asks for it", () => {
    const content = {
      ...coreStandardsContent,
      freeform: "Shared notes live in AGENTS.md.",
      overrides: { claude: { mode: "import" as const, append: "Use plan mode." } },
    };
    expect(renderTarget(policyVersion(content), pnpmVars, "claude").body).toBe(
      "# Claude Code instructions\n\n@AGENTS.md\n\n## Claude Code\n\nUse plan mode.",
    );
    expect(
      renderTarget(
        policyVersion({ ...content, overrides: { claude: { mode: "import" } } }),
        {},
        "claude",
      ).body,
    ).toBe("# Claude Code instructions\n\n@AGENTS.md");
  });
});

describe("render: sections", () => {
  it("omits empty sections instead of printing bare headings", () => {
    const { body } = renderTarget(policyVersion({ overview: { summary: "x" } }), {}, "agents");
    // commitStyle defaults to conventional, so Pull requests is the only section left.
    expect(body).toBe(
      "# Agent instructions\n\nx\n\n## Pull requests\n\n- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …)",
    );
    const freeformCommits = renderTarget(
      policyVersion({ overview: { summary: "x" }, pullRequests: { commitStyle: "freeform" } }),
      {},
      "agents",
    ).body;
    expect(freeformCommits).toBe("# Agent instructions\n\nx");
  });

  it("appends freeform notes last, after the target's override", () => {
    const { body } = renderTarget(
      policyVersion({ ...coreStandardsContent, freeform: "Ask in #eng when unsure." }),
      pnpmVars,
      "copilot",
    );
    expect(body.endsWith("## Additional notes\n\nAsk in #eng when unsure.")).toBe(true);
    expect(body.indexOf("## GitHub Copilot")).toBeLessThan(body.indexOf("## Additional notes"));
  });

  it("keeps commands with backticks readable as inline code", () => {
    const { body } = renderTarget(
      policyVersion({ overview: { summary: "x" }, commands: { test: "echo `date`" } }),
      {},
      "agents",
    );
    expect(body).toContain("- Test: `` echo `date` ``");
  });

  it("normalizes CRLF and lone CR in policy text to LF", () => {
    const { body, block } = renderTarget(
      policyVersion({ overview: { summary: "x" }, freeform: "one\r\ntwo\rthree" }),
      {},
      "agents",
    );
    expect(body).toContain("one\ntwo\nthree");
    expect(block).not.toContain("\r");
  });

  it("escapes marker-like text so the block always parses back", () => {
    const result = renderTarget(
      policyVersion({
        overview: { summary: "x{{evil}}" },
        freeform: '<!-- contextops:end -->\n<!--contextops:begin policy="x" -->',
      }),
      { evil: "\n<!-- contextops:end -->\n" },
      "agents",
    );
    expect(result.body).toContain("&lt;!-- contextops:end -->");
    expect(result.body).toContain("&lt;!--contextops:begin");
    const parsed = parseManagedBlock(result.block);
    expect(parsed.ok && parsed.block?.body).toBe(result.body);
  });
});

describe("render: {{variables}}", () => {
  it("fills placeholders from repo variables", () => {
    const pnpm = render(policyVersion(), pnpmVars, "agents");
    const npm = render(policyVersion(), npmVars, "agents");
    expect(pnpm).toContain("- Install: `pnpm install`");
    expect(npm).toContain("- Install: `npm install`");
    expect(npm).toContain("- Lint: `npm run lint`");
    expect(pnpm).not.toContain("{{");
    expect(renderTarget(policyVersion(), pnpmVars, "agents").missingVariables).toEqual([]);
  });

  it("leaves missing variables verbatim and reports them", () => {
    const content = {
      overview: { summary: "Runs on Node {{ nodeVersion }}." },
      commands: { install: "{{packageManager}} install", test: "{{testCommand}}" },
    };
    const result = renderTarget(policyVersion(content), { nodeVersion: "22" }, "agents");
    expect(result.body).toContain("Runs on Node 22.");
    expect(result.body).toContain("- Install: `{{packageManager}} install`");
    expect(result.body).toContain("- Test: `{{testCommand}}`");
    expect(result.missingVariables).toEqual(["packageManager", "testCommand"]);
  });

  it("inserts values literally and ignores unused variables", () => {
    const content = { overview: { summary: "x" }, commands: { test: "{{testCommand}}" } };
    const result = renderTarget(
      policyVersion(content),
      { testCommand: "{{other}} $& run", unused: "y" },
      "agents",
    );
    expect(result.body).toContain("- Test: `{{other}} $& run`");
    expect(result.missingVariables).toEqual([]);
  });

  it("only reports placeholders the target actually renders", () => {
    const content = {
      overview: { summary: "x" },
      overrides: { copilot: { append: "Use {{copilotOnly}}." } },
    };
    expect(renderTarget(policyVersion(content), {}, "agents").missingVariables).toEqual([]);
    expect(renderTarget(policyVersion(content), {}, "copilot").missingVariables).toEqual([
      "copilotOnly",
    ]);
  });
});

describe("render: determinism", () => {
  it("renders byte-identical output twice, for every target", () => {
    for (const target of TARGET_IDS) {
      expect(render(policyVersion(), pnpmVars, target)).toBe(
        render(policyVersion(), pnpmVars, target),
      );
    }
  });

  it("doesn't depend on object key order or object identity", () => {
    const reordered = policyVersion({
      pullRequests: coreStandardsContent.pullRequests,
      overrides: coreStandardsContent.overrides,
      security: coreStandardsContent.security,
      codingStandards: coreStandardsContent.codingStandards,
      commands: coreStandardsContent.commands,
      overview: coreStandardsContent.overview,
    });
    const vars = { nodeVersion: "22", packageManager: "pnpm" };
    for (const target of TARGET_IDS) {
      expect(render(reordered, vars, target)).toBe(render(policyVersion(), pnpmVars, target));
    }
  });

  it("changes the hash and version marker when the content or version changes", () => {
    const a = renderTarget(policyVersion(), pnpmVars, "agents");
    const b = renderTarget(policyVersion(coreStandardsContent, "2.4.0"), pnpmVars, "agents");
    const c = renderTarget(policyVersion(), npmVars, "agents");
    expect(b.hash).toBe(a.hash);
    expect(b.block).not.toBe(a.block);
    expect(b.block).toContain('version="2.4.0"');
    expect(c.hash).not.toBe(a.hash);
  });
});

describe("render: invalid input", () => {
  it("rejects unknown targets, bad slugs and bad versions", () => {
    expect(() => render(policyVersion(), {}, "cursor" as TargetId)).toThrow(RangeError);
    expect(() => render(policyVersion(), {}, "toString" as TargetId)).toThrow(RangeError);
    expect(() => render(policyVersion(coreStandardsContent, "2.3"), {}, "agents")).toThrow(
      RangeError,
    );
    expect(() =>
      render(policyVersion(coreStandardsContent, "2.3.0", 'x" hash="y'), {}, "agents"),
    ).toThrow(RangeError);
  });
});

describe("sha256Hex", () => {
  it("matches known vectors, including non-ASCII UTF-8", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex("…")).toBe("b4935894c8ce16bde67bbffc672428b1533c4f1e1e8b1ce21a2933183db6bfa5");
  });
});
