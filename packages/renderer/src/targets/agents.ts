import { TARGETS } from "@contextops/policy-schema";
import { fullPolicy } from "../sections";
import type { TargetRenderer } from "./types";

/** `AGENTS.md`: the full policy; the canonical file. */
export const agentsTarget: TargetRenderer = {
  id: "agents",
  path: TARGETS.agents.path,
  renderBody: (content) =>
    fullPolicy("Agent instructions", content, {
      heading: "Agent notes",
      append: content.overrides.agents?.append,
    }),
};
