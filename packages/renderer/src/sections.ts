import type { PolicyContent } from "@contextops/policy-schema";

/**
 * Markdown builders shared by every target. Each returns one chunk of markdown (no leading or
 * trailing blank lines) or `null` when the policy has nothing for that section, so empty
 * sections never show up as a bare heading. Order inside a section is the authored order.
 */

/** Inline code that survives values containing backticks. */
export function code(value: string): string {
  if (!value.includes("`")) return `\`${value}\``;
  const longest = Math.max(...(value.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return `${fence} ${value} ${fence}`;
}

const join = (chunks: (string | null | undefined)[]): string =>
  chunks.filter((c): c is string => typeof c === "string" && c.length > 0).join("\n\n");

export function overview(content: PolicyContent): string {
  const stack = content.overview.stack;
  return join([content.overview.summary, stack.length ? `**Stack:** ${stack.join(", ")}` : null]);
}

const COMMAND_LABELS = [
  ["install", "Install"],
  ["dev", "Dev server"],
  ["test", "Test"],
  ["lint", "Lint"],
  ["typecheck", "Typecheck"],
  ["build", "Build"],
] as const satisfies readonly (readonly [keyof PolicyContent["commands"], string])[];

export function commands(content: PolicyContent): string | null {
  const items = COMMAND_LABELS.flatMap(([key, label]) => {
    const value = content.commands[key];
    return value ? [`- ${label}: ${code(value)}`] : [];
  });
  return items.length ? `## Commands\n\n${items.join("\n")}` : null;
}

export function codingStandards(content: PolicyContent): string | null {
  if (!content.codingStandards.length) return null;
  const items = content.codingStandards.map(
    ({ rule, severity }) => `- **${severity === "must" ? "Must" : "Should"}:** ${rule}`,
  );
  return `## Coding standards\n\n${items.join("\n")}`;
}

export function security(content: PolicyContent): string | null {
  const { secrets, forbiddenPaths, dependencies } = content.security;
  const paths = forbiddenPaths.length
    ? `Never read or write these paths:\n${forbiddenPaths.map((p) => `- ${code(p)}`).join("\n")}`
    : null;
  const body = join([secrets, paths, dependencies]);
  return body ? `## Security\n\n${body}` : null;
}

export function pullRequests(content: PolicyContent): string | null {
  const { branchNaming, commitStyle, checklist } = content.pullRequests;
  const rules = [
    branchNaming ? `- Branch naming: ${branchNaming}` : null,
    commitStyle === "conventional"
      ? "- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …)"
      : null,
  ].filter((line): line is string => line !== null);
  const list = checklist.length
    ? `Before opening a pull request, check:\n${checklist.map((item) => `- ${item}`).join("\n")}`
    : null;
  const body = join([rules.join("\n"), list]);
  return body ? `## Pull requests\n\n${body}` : null;
}

export function freeform(content: PolicyContent): string | null {
  return content.freeform ? `## Additional notes\n\n${content.freeform}` : null;
}

/** A target's own `overrides.<target>.append`, under the target's heading. */
export function targetNotes(heading: string, append: string | undefined): string | null {
  return append ? `## ${heading}\n\n${append}` : null;
}

/** The full policy, in the order every target shares. */
export function fullPolicy(
  title: string,
  content: PolicyContent,
  notes: { heading: string; append: string | undefined },
): string {
  return join([
    `# ${title}`,
    overview(content),
    commands(content),
    codingStandards(content),
    security(content),
    pullRequests(content),
    targetNotes(notes.heading, notes.append),
    freeform(content),
  ]);
}

export { join as joinChunks };
