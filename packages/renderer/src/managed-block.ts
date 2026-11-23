import { sha256Hex } from "./hash";

/**
 * The managed block: the only region of a target file ContextOps owns.
 *
 * ```markdown
 * <!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:<64 hex>" -->
 * …body…
 * <!-- contextops:end -->
 * ```
 *
 * - Each marker sits on its own line (spaces or tabs around it are tolerated).
 * - `hash` is SHA-256 of the body: the text between the begin line and the end line, with LF
 *   line endings and no trailing newline. A CRLF checkout of the same block hashes the same.
 * - A file holds at most one block. Anything ambiguous (a begin without an end, two blocks, a
 *   garbled marker) is a typed error, never a guess, so repo content is never destroyed.
 */

export const END_MARKER = "<!-- contextops:end -->";

export type BlockAttributes = {
  /** Policy slug. */
  policy: string;
  /** Policy version (semver). */
  version: string;
  /** SHA-256 of the body, lowercase hex, without the `sha256:` prefix. */
  hash: string;
};

export type ManagedBlock = BlockAttributes & {
  /** Body with CRLF normalized to LF. */
  body: string;
  /** SHA-256 of `body`, recomputed. */
  bodyHash: string;
  /** `bodyHash === hash`: false means someone edited inside the block. */
  intact: boolean;
  /** Offset of the first character of the begin-marker line. */
  start: number;
  /** Offset just past the end marker (before its line ending, if any). */
  end: number;
  /** Line ending the block was written with. */
  eol: "\n" | "\r\n";
};

export type ManagedBlockErrorCode =
  | "malformed-begin"
  | "malformed-end"
  | "multiple-blocks"
  | "missing-end"
  | "missing-begin"
  | "end-before-begin"
  | "invalid-rendered-block";

export type ManagedBlockError = {
  code: ManagedBlockErrorCode;
  /** 1-based line of the offending marker (0 when not tied to a line). */
  line: number;
  message: string;
};

export type ParseResult =
  { ok: true; block: ManagedBlock | null } | { ok: false; error: ManagedBlockError };

export type ApplyResult =
  | {
      ok: true;
      content: string;
      /**
       * `created`: the file didn't exist. `inserted`: first sync into an existing file without
       * markers. `replaced`: the block changed. `unchanged`: byte-identical to before.
       */
      change: "created" | "inserted" | "replaced" | "unchanged";
    }
  | { ok: false; error: ManagedBlockError };

export const REPOSITORY_NOTES_HEADING = "## Repository notes";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const HEX64 = /^[0-9a-f]{64}$/;

const BEGIN_LINE =
  /^[ \t]*<!-- contextops:begin policy="([a-z0-9-]+)" version="([0-9.]+)" hash="sha256:([0-9a-f]{64})" -->[ \t]*$/;
const END_LINE = /^[ \t]*<!-- contextops:end -->[ \t]*$/;
/** Anything that looks like it wants to be a marker, however garbled. */
const MARKER_LIKE = /^[ \t]*<!--\s*contextops:(begin|end)\b/;

export function beginMarker({ policy, version, hash }: BlockAttributes): string {
  if (!SLUG.test(policy)) throw new RangeError(`Invalid policy slug: ${JSON.stringify(policy)}`);
  if (!SEMVER.test(version)) throw new RangeError(`Invalid version: ${JSON.stringify(version)}`);
  if (!HEX64.test(hash)) throw new RangeError(`Invalid sha256 hex: ${JSON.stringify(hash)}`);
  return `<!-- contextops:begin policy="${policy}" version="${version}" hash="sha256:${hash}" -->`;
}

/** Body text that can never be mistaken for a marker line (rendered as `<!--` in markdown). */
export function escapeMarkers(body: string): string {
  return body.replace(/<!--(\s*)contextops:/g, "&lt;!--$1contextops:");
}

/** Wrap an LF body in markers. The block has no trailing newline. */
export function wrapBlock(policy: string, version: string, body: string): string {
  const hash = sha256Hex(body);
  return `${beginMarker({ policy, version, hash })}\n${body}\n${END_MARKER}`;
}

type Line = { start: number; contentEnd: number; eol: "" | "\n" | "\r\n" };

function splitLines(content: string): Line[] {
  const lines: Line[] = [];
  const re = /\r?\n/g;
  let start = 0;
  for (let m = re.exec(content); m; m = re.exec(content)) {
    lines.push({ start, contentEnd: m.index, eol: m[0] as "\n" | "\r\n" });
    start = m.index + m[0].length;
  }
  lines.push({ start, contentEnd: content.length, eol: "" });
  return lines;
}

const fail = (code: ManagedBlockErrorCode, line: number, message: string): ParseResult => ({
  ok: false,
  error: { code, line, message },
});

/** Find and read the managed block in a file. `block: null` when the file has no markers. */
export function parseManagedBlock(content: string): ParseResult {
  const lines = splitLines(content);
  const begins: { index: number; match: RegExpExecArray }[] = [];
  const ends: number[] = [];

  for (const [index, line] of lines.entries()) {
    const text = content.slice(line.start, line.contentEnd);
    const kind = MARKER_LIKE.exec(text)?.[1];
    if (kind === "begin") {
      const match = BEGIN_LINE.exec(text);
      if (!match || !SEMVER.test(match[2]!) || !SLUG.test(match[1]!)) {
        return fail(
          "malformed-begin",
          index + 1,
          `Line ${index + 1} looks like a ContextOps begin marker but can't be read.`,
        );
      }
      begins.push({ index, match });
    } else if (kind === "end") {
      if (!END_LINE.test(text)) {
        return fail(
          "malformed-end",
          index + 1,
          `Line ${index + 1} looks like a ContextOps end marker but can't be read.`,
        );
      }
      ends.push(index);
    }
  }

  if (begins.length === 0 && ends.length === 0) return { ok: true, block: null };
  if (begins.length > 1 || ends.length > 1) {
    const line = (begins.length > 1 ? begins[1]!.index : ends[1]!) + 1;
    return fail("multiple-blocks", line, "The file has more than one ContextOps managed block.");
  }
  const begin = begins[0];
  const endIndex = ends[0];
  if (!begin) {
    return fail("missing-begin", endIndex! + 1, "The file has an end marker but no begin marker.");
  }
  if (endIndex === undefined) {
    return fail("missing-end", begin.index + 1, "The file has a begin marker but no end marker.");
  }
  if (endIndex < begin.index) {
    return fail("end-before-begin", endIndex + 1, "The end marker comes before the begin marker.");
  }

  const beginLine = lines[begin.index]!;
  const endLine = lines[endIndex]!;
  const raw =
    endIndex === begin.index + 1
      ? ""
      : content.slice(lines[begin.index + 1]!.start, lines[endIndex - 1]!.contentEnd);
  const body = raw.replace(/\r\n/g, "\n");
  const hash = begin.match[3]!;
  const bodyHash = sha256Hex(body);

  return {
    ok: true,
    block: {
      policy: begin.match[1]!,
      version: begin.match[2]!,
      hash,
      body,
      bodyHash,
      intact: bodyHash === hash,
      start: beginLine.start,
      end: endLine.contentEnd,
      eol: beginLine.eol === "\r\n" ? "\r\n" : "\n",
    },
  };
}

/** Parse a block produced by `render()`: exactly one block spanning the whole string. */
function parseRendered(rendered: string): ManagedBlock | ManagedBlockError {
  const parsed = parseManagedBlock(rendered);
  if (
    !parsed.ok ||
    !parsed.block ||
    parsed.block.start !== 0 ||
    parsed.block.end !== rendered.length ||
    rendered.includes("\r") ||
    !parsed.block.intact
  ) {
    return {
      code: "invalid-rendered-block",
      line: 0,
      message: "The rendered block isn't a single, intact managed block. Pass render()'s output.",
    };
  }
  return parsed.block;
}

const isError = (v: ManagedBlock | ManagedBlockError): v is ManagedBlockError => "code" in v;

/**
 * Apply a rendered block (from `render()`) to a target file.
 *
 * - `existing === null` (no file): the block plus a trailing newline.
 * - File with a block: only the region from the begin marker to the end marker is replaced.
 *   Every byte before and after it is kept as is. The new block uses the old block's line
 *   ending, so a CRLF file stays CRLF.
 * - File without markers (first sync): the block goes on top and the existing content is kept,
 *   byte for byte, below a `## Repository notes` heading (not added twice if the content already
 *   starts with one). A UTF-8 BOM stays at the very start. A file with only whitespace is
 *   treated as empty.
 * - Malformed markers: an error, and no content.
 */
export function applyManagedBlock(existing: string | null, rendered: string): ApplyResult {
  const next = parseRendered(rendered);
  if (isError(next)) return { ok: false, error: next };

  if (existing === null) return { ok: true, content: `${rendered}\n`, change: "created" };

  const parsed = parseManagedBlock(existing);
  if (!parsed.ok) return parsed;

  if (parsed.block) {
    const { start, end, eol } = parsed.block;
    const block = eol === "\r\n" ? rendered.replace(/\n/g, "\r\n") : rendered;
    const content = existing.slice(0, start) + block + existing.slice(end);
    return { ok: true, content, change: content === existing ? "unchanged" : "replaced" };
  }

  const bom = existing.startsWith("﻿") ? "﻿" : "";
  const rest = existing.slice(bom.length);
  const eol = /\r?\n/.exec(rest)?.[0] === "\r\n" ? "\r\n" : "\n";
  const block = eol === "\r\n" ? rendered.replace(/\n/g, "\r\n") : rendered;

  if (rest.trim() === "") return { ok: true, content: `${bom}${block}${eol}`, change: "inserted" };

  const firstLine = rest.trimStart().split(/\r?\n/, 1)[0]!.trimEnd();
  const heading =
    firstLine === REPOSITORY_NOTES_HEADING ? "" : `${REPOSITORY_NOTES_HEADING}${eol}${eol}`;
  return { ok: true, content: `${bom}${block}${eol}${eol}${heading}${rest}`, change: "inserted" };
}

/**
 * True when the file's managed block already matches the rendered one: same policy, version,
 * hash and body (line endings aside). The sync job opens no PR then. False for a missing file,
 * a file without a block, malformed markers, or a block edited by hand.
 */
export function isAlreadyCompliant(existing: string | null, rendered: string): boolean {
  if (existing === null) return false;
  const next = parseRendered(rendered);
  if (isError(next)) return false;
  const parsed = parseManagedBlock(existing);
  if (!parsed.ok || !parsed.block) return false;
  const current = parsed.block;
  return (
    current.policy === next.policy &&
    current.version === next.version &&
    current.hash === next.hash &&
    current.body === next.body
  );
}
