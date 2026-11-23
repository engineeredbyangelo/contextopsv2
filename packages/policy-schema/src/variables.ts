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

export type FilledText = {
  /** The text with every known placeholder replaced by its value. */
  text: string;
  /** Distinct placeholder names with no value in `variables`, sorted. They stay in `text` verbatim. */
  missing: string[];
};

/**
 * Replace `{{name}}` (whitespace inside the braces allowed) with `variables[name]`.
 *
 * - One pass: a value that itself contains `{{…}}` is inserted literally, never expanded again.
 * - A placeholder with no value is left exactly as written and reported in `missing`, so the gap
 *   is visible in the rendered file and the sync PR rather than silently becoming an empty string.
 * - Only own keys count, so `{{toString}}` is never filled from the prototype.
 */
export function fillPlaceholders(text: string, variables: RepoVariables): FilledText {
  const missing = new Set<string>();
  const filled = text.replace(PLACEHOLDER, (match, name: string) => {
    if (Object.hasOwn(variables, name)) return variables[name]!;
    missing.add(name);
    return match;
  });
  return { text: filled, missing: [...missing].sort() };
}
