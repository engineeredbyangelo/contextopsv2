/**
 * Output targets. A registry, not a schema enum: adding Cursor rules later means a new
 * entry here plus a renderer module, with no database migration (targets are text[]).
 */
export const TARGETS = {
  agents: { id: "agents", label: "AGENTS.md", path: "AGENTS.md" },
  claude: { id: "claude", label: "Claude Code", path: "CLAUDE.md" },
  copilot: { id: "copilot", label: "GitHub Copilot", path: ".github/copilot-instructions.md" },
} as const;

export type TargetId = keyof typeof TARGETS;
export const TARGET_IDS = Object.keys(TARGETS) as TargetId[];

export function isTargetId(value: string): value is TargetId {
  return Object.hasOwn(TARGETS, value);
}
