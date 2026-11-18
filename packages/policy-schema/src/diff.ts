import type { PolicyContent } from "./policy";

export const POLICY_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "commands", label: "Commands" },
  { key: "codingStandards", label: "Coding standards" },
  { key: "security", label: "Security" },
  { key: "pullRequests", label: "Pull requests" },
  { key: "overrides", label: "Target overrides" },
  { key: "freeform", label: "Additional notes" },
] as const satisfies { key: keyof PolicyContent; label: string }[];

export type SectionKey = (typeof POLICY_SECTIONS)[number]["key"];

export type SectionChange = {
  section: SectionKey;
  label: string;
  change: "added" | "removed" | "changed";
};

/** Stable JSON: object keys sorted, so key order never shows up as a change. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);

/** Which policy sections differ between two versions, in display order. */
export function diffPolicySections(before: PolicyContent, after: PolicyContent): SectionChange[] {
  const changes: SectionChange[] = [];
  for (const { key, label } of POLICY_SECTIONS) {
    const a = before[key];
    const b = after[key];
    if (canonical(a) === canonical(b)) continue;
    const change = isEmpty(a) ? "added" : isEmpty(b) ? "removed" : "changed";
    changes.push({ section: key, label, change });
  }
  return changes;
}
