import type { RolloutCounts } from "@/server/data/types";

/** Stacked bar: merged · up to date · PR open · in progress · failed · skipped. Labelled for screen readers. */
export function RolloutProgress({
  counts,
  className,
}: {
  counts: RolloutCounts;
  className?: string;
}) {
  const segments = [
    { n: counts.merged + counts.upToDate, className: "bg-success", label: "done" },
    { n: counts.prOpen + counts.inProgress, className: "bg-info", label: "in review or running" },
    { n: counts.failed, className: "bg-destructive", label: "failed" },
    { n: counts.skipped, className: "bg-muted-foreground/40", label: "skipped" },
  ];
  const label = segments
    .filter((s) => s.n)
    .map((s) => `${s.n} ${s.label}`)
    .join(", ");
  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`${counts.total} repos: ${label}`}
        className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full"
      >
        {segments.map((s) =>
          s.n ? (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${(s.n / counts.total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
