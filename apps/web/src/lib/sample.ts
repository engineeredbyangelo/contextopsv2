/**
 * Sample data for the marketing landing page. It mirrors the Northwind Labs demo workspace
 * (`server/demo`) but stays a plain module so client components can import it without
 * pulling in the seed generator.
 */

export const SAMPLE_POLICY = {
  name: "Core Standards",
  slug: "core-standards",
  version: "2.3.0",
  previousVersion: "2.2.0",
} as const;

/** Core Standards repos in the scripted rollout, with the sync PR number each one gets. */
export const SAMPLE_ROLLOUT_REPOS = [
  { name: "design-system", pr: 118 },
  { name: "api-gateway", pr: 204 },
  { name: "billing-service", pr: 342 },
  { name: "notifications-service", pr: 97 },
  { name: "auth-service", pr: 151 },
  { name: "mobile-app", pr: 263 },
] as const;

export const SAMPLE_ORG = "northwind-labs";

/** The scripted drift: a manual CLAUDE.md edit in billing-service, then a remediation PR. */
export const SAMPLE_DRIFT = {
  repo: "billing-service",
  file: "CLAUDE.md",
  editor: "Sam Whitfield",
  reviewer: "Daniel Reyes",
  syncPr: 342,
  remediationPr: 347,
} as const;

/** Same diff the demo workspace shows for billing-service (`server/demo/content.ts`). */
export const SAMPLE_DRIFT_DIFF = `diff --git a/CLAUDE.md b/CLAUDE.md
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -12,6 +12,7 @@
 ## Commands

 - Install: \`pnpm install\`
-- Test: \`pnpm test\`
+- Test: \`pnpm test --runInBand\`
+- Never run the e2e suite locally; it hits the staging Stripe account.
 - Lint: \`pnpm run lint\`
 - Typecheck: \`pnpm run typecheck\`
`;

// ── Hero: the sync pull request ────────────────────────────────────────────────

export type SampleSyncState = "merged" | "open";

/** Where each rollout repo's sync PR stands in the hero: merged (Compliant) or open. */
export type SampleHeroRepo = { name: string; pr: number; state: SampleSyncState };

export const SAMPLE_HERO_REPOS: SampleHeroRepo[] = SAMPLE_ROLLOUT_REPOS.map(
  (repo): SampleHeroRepo => ({
    ...repo,
    state: repo.name === "design-system" || repo.name === "api-gateway" ? "merged" : "open",
  }),
);

/** The repo the hero shows on load. */
export const SAMPLE_HERO_DEFAULT_REPO = "billing-service";

/**
 * One line of a hand-written diff. `marker` lines are the contextops begin/end comments;
 * `outside` lines sit outside the managed block (greyed, never changed by a sync); `note`
 * is an annotation between lines, not file content.
 */
export type SampleDiffLine =
  | { kind: "hunk"; text: string }
  | { kind: "add" | "del" | "context"; text: string; marker?: boolean; outside?: boolean }
  | { kind: "note"; text: string };

export type SampleSyncFile = {
  name: string;
  /** How the hero's subline names the file. */
  label: string;
  isNew: boolean;
  lines: SampleDiffLine[];
};

const markerBegin = (version: string) =>
  `<!-- contextops:begin policy="${SAMPLE_POLICY.slug}" version="${version}" -->`;
const MARKER_END = "<!-- contextops:end -->";

/** AGENTS.md and CLAUDE.md: the v2.2.0 to v2.3.0 update, then that file's own notes. */
function versionBump(notes: string[]): SampleDiffLine[] {
  return [
    { kind: "hunk", text: "@@ -1,11 +1,12 @@" },
    { kind: "del", text: markerBegin(SAMPLE_POLICY.previousVersion), marker: true },
    { kind: "add", text: markerBegin(SAMPLE_POLICY.version), marker: true },
    { kind: "context", text: "## Commands" },
    { kind: "context", text: "- Install: `pnpm install`" },
    { kind: "del", text: "- Test: `pnpm test`" },
    { kind: "add", text: "- Test: `pnpm test --coverage`" },
    { kind: "context", text: "- Lint: `pnpm run lint`" },
    { kind: "context", text: "## Security" },
    { kind: "context", text: "- Never commit `.env` files." },
    { kind: "add", text: "- Never paste secrets or tokens into a prompt." },
    { kind: "context", text: MARKER_END, marker: true },
    { kind: "note", text: "Outside the markers. Unchanged, byte for byte." },
    ...notes.map((text): SampleDiffLine => ({ kind: "context", text, outside: true })),
  ];
}

/** The three files in a Core Standards v2.3.0 sync PR, as the hero's file tabs show them. */
export const SAMPLE_SYNC_FILES: SampleSyncFile[] = [
  {
    name: "AGENTS.md",
    label: "AGENTS.md",
    isNew: false,
    lines: versionBump([
      "",
      "## Repository notes",
      "Billing runs against the Stripe test account.",
    ]),
  },
  {
    name: "CLAUDE.md",
    label: "CLAUDE.md",
    isNew: false,
    lines: versionBump([
      "",
      "## Repository notes",
      "Ask #payments before changing webhook handlers.",
    ]),
  },
  {
    name: ".github/copilot-instructions.md",
    label: "Copilot instructions",
    isNew: true,
    lines: [
      { kind: "hunk", text: "@@ -0,0 +1,9 @@" },
      { kind: "add", text: markerBegin(SAMPLE_POLICY.version), marker: true },
      { kind: "add", text: "## Commands" },
      { kind: "add", text: "- Install: `pnpm install`" },
      { kind: "add", text: "- Test: `pnpm test --coverage`" },
      { kind: "add", text: "- Lint: `pnpm run lint`" },
      { kind: "add", text: "## Security" },
      { kind: "add", text: "- Never commit `.env` files." },
      { kind: "add", text: "- Never paste secrets or tokens into a prompt." },
      { kind: "add", text: MARKER_END, marker: true },
      {
        kind: "note",
        text: "First sync: the file didn't exist, so the whole managed block is added.",
      },
    ],
  },
];

/** Added and removed line counts for a file tab (`+3 −2`). */
export function diffCounts(lines: readonly SampleDiffLine[]) {
  return {
    added: lines.filter((l) => l.kind === "add").length,
    removed: lines.filter((l) => l.kind === "del").length,
  };
}
