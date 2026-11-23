import {
  fillPlaceholders,
  isTargetId,
  type PolicyContent,
  type RepoVariables,
  type TargetId,
} from "@contextops/policy-schema";
import { escapeMarkers, wrapBlock } from "./managed-block";
import { sha256Hex } from "./hash";
import { TARGET_RENDERERS } from "./targets";

/** What `render()` needs from a published `policy_versions` row. */
export type PolicyVersionInput = {
  /** Policy slug, e.g. `core-standards`. */
  slug: string;
  /** Semver, e.g. `2.3.0`. */
  version: string;
  /** Parsed content (`policyContentSchema.parse`), defaults applied. */
  content: PolicyContent;
};

export type RenderResult = {
  target: TargetId;
  /** Repo-relative path, e.g. `.github/copilot-instructions.md`. */
  path: string;
  /** The managed block, markers included, LF line endings, no trailing newline. */
  block: string;
  /** The text between the markers. */
  body: string;
  /** SHA-256 hex of `body` (the `hash` attribute without its `sha256:` prefix). */
  hash: string;
  /**
   * Placeholders with no repo variable, sorted. They stay in the output as `{{name}}` so the gap
   * is visible in the PR; callers can warn (preview) or block (rollout) on a non-empty list.
   */
  missingVariables: string[];
};

/**
 * Render one target. Pure and deterministic: same input, byte-identical output; no I/O, clock
 * or randomness. Throws `RangeError` only on programmer error (unknown target, invalid slug or
 * version), which the database constraints already rule out.
 */
export function renderTarget(
  policyVersion: PolicyVersionInput,
  repoVariables: RepoVariables,
  target: TargetId,
): RenderResult {
  if (!isTargetId(target)) throw new RangeError(`Unknown target: ${JSON.stringify(target)}`);
  const renderer = TARGET_RENDERERS[target];
  const filled = fillPlaceholders(renderer.renderBody(policyVersion.content), repoVariables);
  // LF only, and no text that could pass for a marker line, so the block always parses back.
  const body = escapeMarkers(filled.text.replace(/\r\n?/g, "\n"));
  const block = wrapBlock(policyVersion.slug, policyVersion.version, body);
  return {
    target,
    path: renderer.path,
    block,
    body,
    hash: sha256Hex(body),
    missingVariables: filled.missing,
  };
}

/** `render(policyVersion, repoVariables, target) → string`: the managed block for one target. */
export function render(
  policyVersion: PolicyVersionInput,
  repoVariables: RepoVariables,
  target: TargetId,
): string {
  return renderTarget(policyVersion, repoVariables, target).block;
}
