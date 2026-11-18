import { z } from "zod";

/** Per-repo values (packageManager, testCommand, nodeVersion…) that fill {{placeholders}}. */
export const repoVariablesSchema = z.record(
  z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Use letters and digits, starting with a letter"),
  z.string(),
);
export type RepoVariables = z.infer<typeof repoVariablesSchema>;

const PLACEHOLDER = /\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g;

/** Every distinct placeholder name used anywhere in a value tree, sorted. */
export function findPlaceholders(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === "string") for (const m of v.matchAll(PLACEHOLDER)) found.add(m[1]!);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return [...found].sort();
}
