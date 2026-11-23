import type { ReactNode } from "react";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { SAMPLE_POLICY } from "@/lib/sample";
import { BODY, H3, INLINE_CODE } from "./styles";

const STEPS: { title: string; text: string; detail: ReactNode }[] = [
  {
    title: "Write one policy",
    text: "Commands, coding standards, security rules and PR conventions as structured, versioned JSON. Publish with a semver bump and a changelog.",
    detail: (
      <code className={INLINE_CODE}>
        {SAMPLE_POLICY.slug}@{SAMPLE_POLICY.version}
      </code>
    ),
  },
  {
    title: "Assign it to repos",
    text: "Across every connected GitHub org. Per-repo variables fill the placeholders, so one policy fits pnpm and npm repos without forking it.",
    detail: (
      <span className="flex flex-wrap items-center gap-1.5 text-sm">
        <code className={INLINE_CODE}>{"{{packageManager}} test"}</code>
        <span aria-hidden className="text-muted-foreground">
          →
        </span>
        <span className="sr-only">renders as</span>
        <code className={INLINE_CODE}>pnpm test</code>
      </span>
    ),
  },
  {
    title: "Review PRs, drift flagged",
    text: "Each repo gets one sync pull request that you review and merge. Edit a managed block by hand later and the repo shows up as Drifted.",
    detail: (
      <span className="flex flex-wrap gap-1.5">
        <RepoStatusBadge status="compliant" />
        <RepoStatusBadge status="drifted" />
      </span>
    ),
  },
];

/** The three steps, in order. Static: no entrance animation. */
export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
      {STEPS.map((step, i) => (
        <li key={step.title} className="min-w-0 space-y-3 border-t pt-5">
          <span aria-hidden className="text-muted-foreground block font-mono text-xs tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className={H3}>{step.title}</h3>
          <p className={BODY}>{step.text}</p>
          <div className="pt-1 text-sm">{step.detail}</div>
        </li>
      ))}
    </ol>
  );
}
