import { TARGETS } from "@contextops/policy-schema";
import { fullPolicy, joinChunks, targetNotes } from "../sections";
import type { TargetRenderer } from "./types";

const TITLE = "Claude Code instructions";
const NOTES_HEADING = "Claude Code";

/**
 * `CLAUDE.md`. Defaults to a full copy of the policy (product decision), because Claude Code
 * reads CLAUDE.md on its own. `overrides.claude.mode: "import"` renders a thin file that
 * imports `@AGENTS.md` and adds only the Claude-specific notes.
 */
export const claudeTarget: TargetRenderer = {
  id: "claude",
  path: TARGETS.claude.path,
  renderBody: (content) => {
    const override = content.overrides.claude;
    if (override?.mode === "import") {
      return joinChunks([`# ${TITLE}`, "@AGENTS.md", targetNotes(NOTES_HEADING, override.append)]);
    }
    return fullPolicy(TITLE, content, { heading: NOTES_HEADING, append: override?.append });
  },
};
