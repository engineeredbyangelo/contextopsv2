/**
 * The pure renderer. See docs/spec.md → "GitHub integration & sync engine" → "2. Rendering".
 *
 * - `render()` / `renderTarget()` turn a policy version plus repo variables into one target's
 *   managed block.
 * - `applyManagedBlock()` merges that block into the current file without touching anything
 *   outside the markers; `isAlreadyCompliant()` tells the sync job there's nothing to open a PR
 *   for; `parseManagedBlock()` reads an existing block for drift detection.
 *
 * No I/O, clock or randomness anywhere in this package.
 */
export { render, renderTarget, type PolicyVersionInput, type RenderResult } from "./render";
export {
  applyManagedBlock,
  beginMarker,
  END_MARKER,
  isAlreadyCompliant,
  parseManagedBlock,
  REPOSITORY_NOTES_HEADING,
  type ApplyResult,
  type BlockAttributes,
  type ManagedBlock,
  type ManagedBlockError,
  type ManagedBlockErrorCode,
  type ParseResult,
} from "./managed-block";
export { TARGET_RENDERERS, type TargetRenderer } from "./targets";
export { sha256Hex } from "./hash";
