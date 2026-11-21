import { readFileSync } from "node:fs";
const cmd = JSON.parse(readFileSync(0, "utf8")).tool_input?.command ?? "";
const rules = [
  [/(^|[;&|(]\s*)(rm|mv|cp|touch|chmod|ln)\s/, "file-changing command"],
  [/\bsed\s+-i/, "sed -i"],
  [/\btee\s+(?!(-a\s+)?\/tmp\/)/, "tee outside /tmp"],
  [/(?<!>)>>?(?!>|\s*(\/tmp\/|\/dev\/null|&))/, "redirect outside /tmp"],
  [/--write\b|--fix\b|--update-snapshots\b|\s-u(\s|$)/, "auto-fix or snapshot update"],
  [
    /\bgit\s+(add|checkout|restore|stash|reset|commit|push|clean|switch|merge|rebase)\b/,
    "git write",
  ],
  [
    /\bpnpm\s+(format|db:types|db:seed:generate|add|install|remove)(?=\s|$)/,
    "generator or install",
  ],
];
for (const [re, why] of rules)
  if (re.test(cmd)) {
    console.error(`Blocked (${why}): the checker is read-only. Report it instead.`);
    process.exit(2);
  }
