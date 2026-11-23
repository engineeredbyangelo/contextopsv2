import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SampleDiffLine } from "@/lib/sample";

/**
 * The landing page's code look, shared by the hero PR, the first-sync file view and the How it
 * works snippets. Colors match the app's DiffViewer (`.diff-themed`): rows tinted with
 * --success / --destructive at 12%, text in the foreground color so tinted rows keep AA
 * contrast in both themes, and only the +/− sign colored.
 */

/** The bracket that runs from a begin marker to its end marker. Decorative. */
export function Bracket({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "border-foreground/20 pointer-events-none absolute top-[0.7em] bottom-[0.7em] w-2.5 rounded-l-md border-[1.5px] border-r-0",
        className,
      )}
    />
  );
}

/**
 * A small contextops marker comment, attribute values tinted. The text is the literal marker,
 * so it reads (and matches) as `<!-- contextops:begin policy="…" version="…" -->`.
 */
export function MarkerLine({
  kind,
  policy,
  version,
  testId,
}: {
  kind: "begin" | "end";
  policy?: string;
  version?: string;
  testId?: string;
}) {
  return (
    <p
      data-testid={testId}
      className="text-muted-foreground font-mono text-[12.5px] leading-snug [overflow-wrap:anywhere]"
    >
      {kind === "end" ? (
        "<!-- contextops:end -->"
      ) : (
        <>
          {"<!-- contextops:begin policy="}
          <span className="text-success">{`"${policy}"`}</span>
          {" version="}
          <span className="text-success">{`"${version}"`}</span>
          {" -->"}
        </>
      )}
    </p>
  );
}

/**
 * Small begin and end markers with a bracket between them: the managed-block motif. The
 * footnote sits below, outside the bracket.
 */
export function ManagedFrame({
  policy,
  version,
  children,
  footnote,
  testIdPrefix,
  className,
}: {
  policy: string;
  version: string;
  children: ReactNode;
  footnote?: ReactNode;
  testIdPrefix?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="relative grid min-w-0 grid-cols-1 gap-2.5 pl-[22px]">
        <Bracket className="left-1" />
        <MarkerLine
          kind="begin"
          policy={policy}
          version={version}
          testId={testIdPrefix && `${testIdPrefix}-begin`}
        />
        {children}
        <MarkerLine kind="end" testId={testIdPrefix && `${testIdPrefix}-end`} />
      </div>
      {footnote ? (
        <p className="text-muted-foreground mt-2 pl-[22px] text-[13px] leading-snug">{footnote}</p>
      ) : null}
    </div>
  );
}

const SIGN = { add: "+", del: "−", context: "" } as const;
const SR_SIGN = { add: "Added: ", del: "Removed: ", context: "" } as const;

/**
 * Diff or file lines. Render inside a horizontally scrolling container (`overflow-x-auto`
 * plus `CODE_TEXT`): rows never wrap, so long lines scroll instead of overflowing the page.
 */
export function CodeLines({ lines }: { lines: readonly SampleDiffLine[] }) {
  return (
    <div className="w-max min-w-full">
      {lines.map((line, i) => {
        if (line.kind === "note") {
          return (
            <div key={i} className="mt-1.5 mb-0.5 border-t border-dashed">
              <p className="text-muted-foreground sticky left-0 max-w-[min(34rem,calc(100vw-5rem))] px-7 pt-1.5 font-sans text-xs leading-snug whitespace-normal">
                {line.text}
              </p>
            </div>
          );
        }
        if (line.kind === "hunk") {
          return (
            <div
              key={i}
              className="text-muted-foreground grid grid-cols-[1.75rem_auto] pr-4 whitespace-pre"
            >
              <span aria-hidden />
              <span>{line.text}</span>
            </div>
          );
        }
        const tinted = line.kind !== "context";
        return (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[1.75rem_auto] pr-4 whitespace-pre",
              line.kind === "add" && "bg-success/12",
              line.kind === "del" && "bg-destructive/12",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "text-center select-none",
                line.kind === "add" && "text-success",
                line.kind === "del" && "text-destructive",
              )}
            >
              {SIGN[line.kind]}
            </span>
            <span
              className={cn(
                // Muted only on untinted rows: muted text on a tinted row would drop below AA.
                !tinted && (line.marker || line.outside) && "text-muted-foreground",
              )}
            >
              {tinted ? <span className="sr-only">{SR_SIGN[line.kind]}</span> : null}
              {line.text || " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}
