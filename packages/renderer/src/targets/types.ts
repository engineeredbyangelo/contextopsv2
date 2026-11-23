import type { PolicyContent, TargetId } from "@contextops/policy-schema";

/**
 * One output target. Adding a target (Cursor rules is next) means a new entry in
 * `@contextops/policy-schema` → `TARGETS` and a new module here registered in `./index.ts`.
 * No schema or database change: targets are stored as `text[]`.
 */
export type TargetRenderer = {
  id: TargetId;
  /** Repo-relative path the sync job writes. */
  path: string;
  /**
   * The markdown between the managed-block markers, before `{{variable}}` fill.
   * Must be pure: no I/O, clock or randomness.
   */
  renderBody(content: PolicyContent): string;
};
