import { describe, expect, it } from "vitest";
import { coreStandardsContent, npmVars, pnpmVars, policyVersion } from "./fixtures";
import {
  applyManagedBlock,
  isAlreadyCompliant,
  parseManagedBlock,
  render,
  renderTarget,
  type ApplyResult,
} from "./index";

const v230 = render(policyVersion(), pnpmVars, "agents");
const v240 = render(
  policyVersion({ ...coreStandardsContent, freeform: "New in 2.4.0." }, "2.4.0"),
  pnpmVars,
  "agents",
);

const crlf = (s: string) => s.replace(/\n/g, "\r\n");

function contentOf(result: ApplyResult): string {
  if (!result.ok) throw new Error(`Expected ok, got ${result.error.code}`);
  return result.content;
}

describe("parseManagedBlock", () => {
  it("round-trips a rendered block: policy, version, hash and body", () => {
    const rendered = renderTarget(policyVersion(), pnpmVars, "claude");
    const parsed = parseManagedBlock(rendered.block);
    expect(parsed).toEqual({
      ok: true,
      block: {
        policy: "core-standards",
        version: "2.3.0",
        hash: rendered.hash,
        body: rendered.body,
        bodyHash: rendered.hash,
        intact: true,
        start: 0,
        end: rendered.block.length,
        eol: "\n",
      },
    });
  });

  it("returns null for a file without markers", () => {
    expect(parseManagedBlock("# Notes\n\nNothing managed here.\n")).toEqual({
      ok: true,
      block: null,
    });
    expect(parseManagedBlock("")).toEqual({ ok: true, block: null });
  });

  it("reads a block in the middle of a file, with CRLF, at the right offsets", () => {
    const file = `Intro\r\n\r\n${crlf(v230)}\r\nTail\r\n`;
    const parsed = parseManagedBlock(file);
    if (!parsed.ok || !parsed.block) throw new Error("expected a block");
    expect(parsed.block.eol).toBe("\r\n");
    expect(parsed.block.intact).toBe(true);
    expect(file.slice(parsed.block.start, parsed.block.end)).toBe(crlf(v230));
    expect(parsed.block.body).toBe(renderTarget(policyVersion(), pnpmVars, "agents").body);
  });

  it("flags a hand edit inside the block as not intact (drift)", () => {
    const edited = v230.replace("- Test: `pnpm test`", "- Test: `pnpm test --runInBand`");
    const parsed = parseManagedBlock(`${edited}\n`);
    if (!parsed.ok || !parsed.block) throw new Error("expected a block");
    expect(parsed.block.intact).toBe(false);
    expect(parsed.block.bodyHash).not.toBe(parsed.block.hash);
  });

  it("tolerates spaces around markers", () => {
    const [begin, ...rest] = v230.split("\n");
    const end = rest.pop();
    const file = `  ${begin}\t\n${rest.join("\n")}\n${end}  \n`;
    const parsed = parseManagedBlock(file);
    expect(parsed.ok && parsed.block?.intact).toBe(true);
  });

  describe("malformed markers are typed errors", () => {
    const [begin] = v230.split("\n");
    const cases: [string, string, string, number][] = [
      ["begin without end", `Top\n${begin}\nbody\n`, "missing-end", 2],
      ["end without begin", "Top\nbody\n<!-- contextops:end -->\n", "missing-begin", 3],
      ["two blocks", `${v230}\n\n${v230}\n`, "multiple-blocks", v230.split("\n").length + 2],
      [
        "two ends",
        `${v230}\n<!-- contextops:end -->\n`,
        "multiple-blocks",
        v230.split("\n").length + 1,
      ],
      ["end before begin", `<!-- contextops:end -->\n${begin}\n`, "end-before-begin", 1],
      [
        "begin without hash",
        '<!-- contextops:begin policy="core-standards" version="2.3.0" -->\nx\n<!-- contextops:end -->\n',
        "malformed-begin",
        1,
      ],
      [
        "begin with a short hash",
        '<!-- contextops:begin policy="a" version="1.0.0" hash="sha256:abc" -->\n<!-- contextops:end -->',
        "malformed-begin",
        1,
      ],
      [
        "begin with a bad version",
        begin!.replace('version="2.3.0"', 'version="2.3"') + "\n<!-- contextops:end -->",
        "malformed-begin",
        1,
      ],
      ["garbled end", `${begin}\nx\n<!-- contextops:end->\n`, "malformed-end", 3],
    ];

    for (const [name, file, code, line] of cases) {
      it(name, () => {
        const parsed = parseManagedBlock(file);
        expect(parsed.ok).toBe(false);
        if (!parsed.ok) {
          expect(parsed.error.code).toBe(code);
          expect(parsed.error.line).toBe(line);
          expect(parsed.error.message).not.toBe("");
        }
        const applied = applyManagedBlock(file, v230);
        expect(applied).toEqual({ ok: false, error: expect.objectContaining({ code }) });
        expect(isAlreadyCompliant(file, v230)).toBe(false);
      });
    }
  });
});

describe("applyManagedBlock", () => {
  it("first sync into a missing file: just the block and a trailing newline", () => {
    expect(applyManagedBlock(null, v230)).toEqual({
      ok: true,
      content: `${v230}\n`,
      change: "created",
    });
  });

  it("first sync into a file without markers keeps it below Repository notes", () => {
    const existing = "# Our agent notes\n\nRun `make bootstrap` first.\n";
    const result = applyManagedBlock(existing, v230);
    expect(result).toEqual({
      ok: true,
      content: `${v230}\n\n## Repository notes\n\n${existing}`,
      change: "inserted",
    });
    expect(contentOf(result).endsWith(existing)).toBe(true);
  });

  it("first sync keeps a file without a trailing newline as is", () => {
    const existing = "Line one\nLine two, no newline";
    expect(contentOf(applyManagedBlock(existing, v230))).toBe(
      `${v230}\n\n## Repository notes\n\n${existing}`,
    );
  });

  it("first sync doesn't add a second Repository notes heading", () => {
    const existing = "\n## Repository notes\n\nKeep me.\n";
    expect(contentOf(applyManagedBlock(existing, v230))).toBe(`${v230}\n\n${existing}`);
  });

  it("first sync into a CRLF file writes the block with CRLF and keeps the file", () => {
    const existing = "# Notes\r\n\r\nWindows line endings.\r\n";
    const content = contentOf(applyManagedBlock(existing, v230));
    expect(content).toBe(`${crlf(v230)}\r\n\r\n## Repository notes\r\n\r\n${existing}`);
    expect(content.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });

  it("first sync keeps a UTF-8 BOM at the start", () => {
    const existing = "﻿# Notes\n";
    expect(contentOf(applyManagedBlock(existing, v230))).toBe(
      `﻿${v230}\n\n## Repository notes\n\n# Notes\n`,
    );
  });

  it("treats an empty or whitespace-only file as empty", () => {
    expect(applyManagedBlock("", v230)).toEqual({
      ok: true,
      content: `${v230}\n`,
      change: "inserted",
    });
    expect(contentOf(applyManagedBlock(" \n\n", v230))).toBe(`${v230}\n`);
  });

  it("replaces only the managed region, every byte outside it preserved", () => {
    const before = "Intro written by the repo.\n\n";
    const after = "\n\n## Repository notes\n\n  Indented, trailing spaces   \n\n\n";
    const result = applyManagedBlock(`${before}${v230}${after}`, v240);
    expect(result).toEqual({ ok: true, content: `${before}${v240}${after}`, change: "replaced" });
  });

  it("preserves a file that ends right at the end marker (no trailing newline)", () => {
    expect(contentOf(applyManagedBlock(`Top\n${v230}`, v240))).toBe(`Top\n${v240}`);
  });

  it("keeps CRLF files CRLF when replacing", () => {
    const before = "Intro\r\n\r\n";
    const after = "\r\n\r\nTail\r\n";
    const result = applyManagedBlock(`${before}${crlf(v230)}${after}`, v240);
    expect(contentOf(result)).toBe(`${before}${crlf(v240)}${after}`);
  });

  it("is a no-op when the block already matches", () => {
    const file = `Intro\n\n${v230}\n\nTail\n`;
    expect(applyManagedBlock(file, v230)).toEqual({ ok: true, content: file, change: "unchanged" });
  });

  it("round-trips: apply, parse back, apply again", () => {
    const first = contentOf(applyManagedBlock("# Notes\n", v230));
    const parsed = parseManagedBlock(first);
    expect(parsed.ok && parsed.block?.version).toBe("2.3.0");
    const second = contentOf(applyManagedBlock(first, v240));
    expect(second).toBe(`${v240}\n\n## Repository notes\n\n# Notes\n`);
    expect(applyManagedBlock(second, v240)).toMatchObject({ change: "unchanged" });
  });

  it("restores a hand-edited block without touching the rest", () => {
    const edited = v230.replace("- Lint: `pnpm run lint`", "- Lint: skip it");
    const file = `${edited}\n\n## Repository notes\n\nMine.\n`;
    expect(contentOf(applyManagedBlock(file, v230))).toBe(
      `${v230}\n\n## Repository notes\n\nMine.\n`,
    );
  });

  it("rejects something that isn't render()'s output", () => {
    for (const bad of [
      "not a block",
      `${v230}\n`,
      `x${v230}`,
      crlf(v230),
      v230.replace("Must", "Can"),
    ]) {
      expect(applyManagedBlock("# Notes\n", bad)).toEqual({
        ok: false,
        error: expect.objectContaining({ code: "invalid-rendered-block" }),
      });
    }
  });
});

describe("isAlreadyCompliant", () => {
  it("is true when the file's block matches, wherever it sits", () => {
    expect(isAlreadyCompliant(`${v230}\n`, v230)).toBe(true);
    expect(isAlreadyCompliant(`Intro\n\n${v230}\n\n## Repository notes\n\nx\n`, v230)).toBe(true);
  });

  it("ignores line endings (a CRLF checkout of the same block is compliant)", () => {
    expect(isAlreadyCompliant(`${crlf(v230)}\r\n`, v230)).toBe(true);
  });

  it("is false for a missing file or a file without a block", () => {
    expect(isAlreadyCompliant(null, v230)).toBe(false);
    expect(isAlreadyCompliant("# Notes\n", v230)).toBe(false);
  });

  it("is false for another version, other variables or another policy", () => {
    expect(isAlreadyCompliant(`${v230}\n`, v240)).toBe(false);
    expect(isAlreadyCompliant(`${v230}\n`, render(policyVersion(), npmVars, "agents"))).toBe(false);
    const otherPolicy = render(
      policyVersion(coreStandardsContent, "2.3.0", "nextjs-supabase"),
      pnpmVars,
      "agents",
    );
    expect(isAlreadyCompliant(`${v230}\n`, otherPolicy)).toBe(false);
  });

  it("is false when the block was edited by hand, even with the old hash", () => {
    const edited = v230.replace("- Test: `pnpm test`", "- Test: `pnpm test --runInBand`");
    expect(isAlreadyCompliant(`${edited}\n`, v230)).toBe(false);
  });

  it("is false when given something that isn't render()'s output", () => {
    expect(isAlreadyCompliant(`${v230}\n`, "nope")).toBe(false);
  });
});
