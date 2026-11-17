import type { Policy } from "@contextops/policy-schema";

/** Output targets. A registry so new targets (e.g. Cursor rules) are new modules. */
export type Target = "agents" | "claude" | "copilot";

/**
 * Pure render: same input, byte-identical output. See docs/spec.md → "Rendering".
 * Implemented in phase 2.
 */
export function render(
  _policy: Policy,
  _variables: Record<string, string>,
  _target: Target,
): string {
  throw new Error("render() not implemented yet");
}
