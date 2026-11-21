import { readFileSync, existsSync } from "node:fs";
const { tool_name, tool_input = {} } = JSON.parse(readFileSync(0, "utf8"));
const block = (why) => {
  console.error(`Blocked: ${why}`);
  process.exit(2);
};

if (tool_name === "Bash") {
  const cmd = tool_input.command ?? "";
  if (
    /\bpnpm\b[^;&|]*\s(check|verify|test|test:e2e|lint|typecheck|db:test)(?=\s|$)/.test(cmd) ||
    /(^|[;&|]\s*)(pnpm\s+exec\s+|npx\s+)?(tsc|eslint|vitest|playwright)\b/.test(cmd)
  )
    block("grading your own work is the checker's job. Put it under 'For the checker'.");
  if (/\bgit\s+(commit|push|merge|rebase|reset)\b|\bgh\s+pr\b/.test(cmd))
    block("the orchestrator and the user own git history.");
} else {
  const f = tool_input.file_path ?? "";
  if (
    /(^|\/)(CLAUDE\.md|docs\/spec\.md|\.claude\/|\.github\/workflows\/)|(eslint|vitest|playwright)\.config\.|tsconfig[^/]*\.json$|seed\.sql$|seed_status\.test\.sql$|database\.types\.ts$/.test(
      f,
    )
  )
    block(`${f} is protected. Raise it in your report instead.`);
  if (f.includes("supabase/migrations/") && existsSync(f))
    block("never edit an existing migration. Add a new one.");
  const text = tool_input.new_string ?? tool_input.content ?? "";
  if (/\b(it|test|describe)\.(skip|only)\(|@ts-(ignore|nocheck)|eslint-disable/.test(text))
    block("no .skip, .only, @ts-ignore or eslint-disable. Fix the cause or flag it.");
}
