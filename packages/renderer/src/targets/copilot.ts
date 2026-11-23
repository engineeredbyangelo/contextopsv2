import { TARGETS } from "@contextops/policy-schema";
import { fullPolicy } from "../sections";
import type { TargetRenderer } from "./types";

/** `.github/copilot-instructions.md`: the full policy plus Copilot overrides. */
export const copilotTarget: TargetRenderer = {
  id: "copilot",
  path: TARGETS.copilot.path,
  renderBody: (content) =>
    fullPolicy("Copilot instructions", content, {
      heading: "GitHub Copilot",
      append: content.overrides.copilot?.append,
    }),
};
