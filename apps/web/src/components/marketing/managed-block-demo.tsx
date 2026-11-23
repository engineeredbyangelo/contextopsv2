"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SAMPLE_DRIFT, SAMPLE_POLICY, diffCounts, type SampleDiffLine } from "@/lib/sample";
import { Bracket, CodeLines } from "./code";
import { CODE_CARD, CODE_TEXT } from "./styles";

type View = "before" | "after";

const { slug, version } = SAMPLE_POLICY;
const BEGIN = `<!-- contextops:begin policy="${slug}" version="${version}" hash="sha256:27ce8e9d…" -->`;
const END = "<!-- contextops:end -->";

/** The managed region the first sync PR adds to billing-service's CLAUDE.md (abridged). */
const MANAGED: SampleDiffLine[] = [
  { kind: "add", text: BEGIN, marker: true },
  { kind: "add", text: "# Claude Code instructions" },
  { kind: "add", text: "⋯ Overview, Commands, Coding standards" },
  { kind: "add", text: "## Security" },
  { kind: "add", text: "Never read or write these paths:" },
  { kind: "add", text: "- `.env*`" },
  { kind: "add", text: "- `**/*.pem`" },
  { kind: "add", text: "- `infra/secrets/**`" },
  { kind: "add", text: "⋯ Pull requests" },
  { kind: "add", text: END, marker: true },
];

/** What the file held before ContextOps. The first sync keeps it byte for byte. */
const EXISTING = [
  "Run `pnpm stripe:listen` before testing webhooks locally.",
  "Ask in #payments before changing webhook retries.",
];

/** After the first sync: below the block, a new heading over the untouched old content. */
const OUTSIDE_AFTER: SampleDiffLine[] = [
  { kind: "add", text: "" },
  { kind: "add", text: "## Repository notes" },
  { kind: "add", text: "" },
  { kind: "note", text: "Outside the markers: the file's existing content, byte for byte." },
  ...EXISTING.map((text): SampleDiffLine => ({ kind: "context", text, outside: true })),
];

const ADDED = diffCounts([...MANAGED, ...OUTSIDE_AFTER]).added;

const BEFORE: SampleDiffLine[] = EXISTING.map((text) => ({ kind: "context", text }));

/** Rows plus note, so both views keep one height. Rows are 1.25rem (leading-5). */
const MIN_HEIGHT = `${(MANAGED.length + OUTSIDE_AFTER.length) * 1.25 + 2.5}rem`;

/**
 * A file view of a first sync: before (no markers) and after (block on top, bracketed like the
 * hero's managed block, the old content under Repository notes). Switches only when the
 * visitor picks a view; nothing autoplays.
 */
export function ManagedBlockDemo() {
  const [view, setView] = useState<View>("after");

  return (
    <div data-testid="managed-block-demo" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm" data-testid="managed-block-version">
          {view === "after"
            ? `After the first sync PR, policy v${version}`
            : "Before: no ContextOps markers yet"}
        </p>
        <div role="group" aria-label="File version" className="flex gap-1">
          {(["before", "after"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? "secondary" : "ghost"}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === "before" ? "Before" : "After the first sync"}
            </Button>
          ))}
        </div>
      </div>

      <div className={CODE_CARD}>
        <div className="bg-muted/50 flex items-center justify-between gap-3 border-b px-4 py-2">
          <span className="min-w-0 truncate font-mono text-xs font-medium">
            {SAMPLE_DRIFT.repo}/{SAMPLE_DRIFT.file}
          </span>
          {view === "after" ? (
            <span className="shrink-0 font-mono text-xs tabular-nums">
              <span aria-hidden>
                <span className="text-success">+{ADDED}</span>{" "}
                <span className="text-destructive">−0</span>
              </span>
              <span className="sr-only">{ADDED} lines added, none removed</span>
            </span>
          ) : null}
        </div>
        <div className={cn(CODE_TEXT, "overflow-x-auto py-2")} style={{ minHeight: MIN_HEIGHT }}>
          {view === "after" ? (
            <div className="w-max min-w-full pl-5">
              <div className="relative">
                <Bracket className="-left-4" />
                <CodeLines lines={MANAGED} />
              </div>
              <CodeLines lines={OUTSIDE_AFTER} />
            </div>
          ) : (
            <div className="w-max min-w-full pl-5">
              <CodeLines lines={BEFORE} />
            </div>
          )}
        </div>
      </div>

      <ul className="grid gap-3 text-sm sm:grid-cols-2">
        <li className="flex gap-3">
          <span
            aria-hidden
            className="border-foreground/20 mt-1 w-2.5 shrink-0 self-stretch rounded-l-md border-[1.5px] border-r-0"
          />
          <span>
            <span className="block font-medium">Between the markers</span>
            <span className="text-muted-foreground">
              Rendered from the policy. Each sync PR rewrites only this region.
            </span>
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="mt-2.5 w-2.5 shrink-0 self-start border-t border-dashed" />
          <span>
            <span className="block font-medium">Outside the markers</span>
            <span className="text-muted-foreground">
              Your repository notes, preserved byte for byte.
            </span>
          </span>
        </li>
      </ul>
    </div>
  );
}
