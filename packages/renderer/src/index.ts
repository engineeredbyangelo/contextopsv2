import type { PolicyContent, RepoVariables, TargetId } from "@contextops/policy-schema";

/**
 * Pure render: same input, byte-identical output. See docs/spec.md → "Rendering".
 * Implemented in phase 2.
 */
export function render(
  _policy: PolicyContent,
  _variables: RepoVariables,
  _target: TargetId,
): string {
  throw new Error("render() not implemented yet");
}
