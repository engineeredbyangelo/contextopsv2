import type { TargetId } from "@contextops/policy-schema";
import { agentsTarget } from "./agents";
import { claudeTarget } from "./claude";
import { copilotTarget } from "./copilot";
import type { TargetRenderer } from "./types";

export type { TargetRenderer } from "./types";

/**
 * The target registry. Typed as `Record<TargetId, …>` so adding a target to
 * `@contextops/policy-schema` → `TARGETS` fails to compile until its module is registered here.
 */
export const TARGET_RENDERERS: Readonly<Record<TargetId, TargetRenderer>> = {
  agents: agentsTarget,
  claude: claudeTarget,
  copilot: copilotTarget,
};
