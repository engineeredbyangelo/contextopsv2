"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { CircleCheck, GitMerge, GitPullRequestArrow, Pause, Play } from "lucide-react";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  SAMPLE_HERO_DEFAULT_REPO,
  SAMPLE_HERO_REPOS,
  SAMPLE_ORG,
  SAMPLE_POLICY,
  SAMPLE_SYNC_FILES,
  diffCounts,
  type SampleSyncState,
} from "@/lib/sample";
import { CodeLines, ManagedFrame } from "./code";
import { CODE_CARD, CODE_TEXT, FOCUS, FOCUS_INSET, INLINE_CODE } from "./styles";
import { useInView, useMotionAllowed } from "./use-motion";

/** How long each file tab shows before the next one, while auto-advancing. */
const ADVANCE_MS = 3400;

const policyLabel = `${SAMPLE_POLICY.name} v${SAMPLE_POLICY.version}`;
const prTitle = `chore(agents): sync ${policyLabel}`;
const branch = `contextops/sync-${SAMPLE_POLICY.slug}`;
const DEFAULT_REPO = Math.max(
  0,
  SAMPLE_HERO_REPOS.findIndex((r) => r.name === SAMPLE_HERO_DEFAULT_REPO),
);
/** Tallest file, so switching tabs never moves the page. Rows are 1.25rem (leading-5). */
const PANEL_MIN_HEIGHT = `${Math.max(...SAMPLE_SYNC_FILES.map((f) => f.lines.length)) * 1.25 + 2.5}rem`;

/**
 * "auto": the file tabs advance on their own until the first hover, focus or click.
 * "paused" / "playing": the visitor has interacted, or used the pause control.
 */
type Mode = "auto" | "paused" | "playing";

type HeroSyncValue = {
  file: number;
  changed: boolean;
  mode: Mode;
  selectFile: (index: number) => void;
  advance: () => void;
  interact: () => void;
  togglePlay: () => void;
  ids: { panel: string; tab: (index: number) => string };
};

const HeroSync = createContext<HeroSyncValue | null>(null);

function useHeroSync() {
  const value = useContext(HeroSync);
  if (!value) throw new Error("HeroSync components must sit inside <HeroSyncProvider>");
  return value;
}

/**
 * Shares the selected file between the subline's filename buttons and the PR card. Wraps the
 * hero's server-rendered markup; only the buttons and the frame below are client code.
 */
export function HeroSyncProvider({ children }: { children: ReactNode }) {
  const uid = useId();
  const [file, setFile] = useState(0);
  const [changed, setChanged] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");

  const selectFile = useCallback((index: number) => {
    setFile(index);
    setChanged(true);
  }, []);
  const advance = useCallback(() => {
    setFile((f) => (f + 1) % SAMPLE_SYNC_FILES.length);
    setChanged(true);
  }, []);
  const interact = useCallback(() => setMode((m) => (m === "auto" ? "paused" : m)), []);
  const togglePlay = useCallback(() => setMode((m) => (m === "paused" ? "playing" : "paused")), []);

  const value = useMemo<HeroSyncValue>(
    () => ({
      file,
      changed,
      mode,
      selectFile,
      advance,
      interact,
      togglePlay,
      ids: { panel: `${uid}-file-panel`, tab: (i) => `${uid}-file-tab-${i}` },
    }),
    [file, changed, mode, selectFile, advance, interact, togglePlay, uid],
  );

  return <HeroSync.Provider value={value}>{children}</HeroSync.Provider>;
}

/** A filename in the subline. Pressing it shows that file's tab in the PR card. */
export function FileButton({ index }: { index: number }) {
  const { file, selectFile, interact, ids } = useHeroSync();
  const target = SAMPLE_SYNC_FILES[index]!;
  return (
    <button
      type="button"
      aria-pressed={file === index}
      aria-controls={ids.panel}
      onPointerEnter={interact}
      onFocus={interact}
      onClick={() => {
        interact();
        selectFile(index);
      }}
      className={cn(
        FOCUS,
        "text-foreground cursor-pointer rounded-md px-[0.2em] font-mono text-[0.9em] whitespace-nowrap transition-colors",
        "decoration-muted-foreground underline decoration-dotted decoration-[1.5px] underline-offset-[0.2em] hover:decoration-current",
        // Pressed: green tint. Light mode keeps foreground text for AA on the tint.
        "aria-pressed:bg-success/15 aria-pressed:decoration-success dark:aria-pressed:text-success aria-pressed:decoration-solid",
      )}
    >
      {target.label}
    </button>
  );
}

/** Arrow keys, Home and End for a tablist. Returns the index to select, or null. */
function nextTab(key: string, index: number, count: number) {
  switch (key) {
    case "ArrowRight":
      return (index + 1) % count;
    case "ArrowLeft":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

function PrState({ state }: { state: SampleSyncState }) {
  const merged = state === "merged";
  const Icon = merged ? GitMerge : GitPullRequestArrow;
  return (
    <span
      data-testid="pr-state"
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium",
        TONE_CLASSES[merged ? "success" : "info"],
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {merged ? "Merged" : "Open"}
    </span>
  );
}

/**
 * The hero's right column: a real sync pull request framed by the managed-block markers.
 * Repo chips (click only) switch the PR; file tabs auto-advance until the visitor interacts,
 * with a visible pause control (WCAG 2.2.2). Server HTML and the first client render match:
 * AGENTS.md and billing-service selected, no pause control, nothing moving.
 */
export function SyncPrFrame() {
  const { file, changed, mode, selectFile, advance, interact, togglePlay, ids } = useHeroSync();
  const uid = useId();
  const hydrated = useHydrated();
  const motionOk = useMotionAllowed();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });
  const [repoIndex, setRepoIndex] = useState(DEFAULT_REPO);
  const repoTabs = useRef<(HTMLButtonElement | null)[]>([]);
  const fileTabs = useRef<(HTMLButtonElement | null)[]>([]);

  const running = motionOk && inView && mode !== "paused";
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(advance, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [running, advance]);

  // The first hover, focus or click anywhere in the frame stops auto-advance. Focusing or
  // clicking the pause control itself doesn't count: that control says what it will do.
  const onInteract = (event: SyntheticEvent) => {
    if (event.target instanceof Element && event.target.closest("[data-autoplay-toggle]")) return;
    interact();
  };

  const onRepoKey = (event: KeyboardEvent, index: number) => {
    const next = nextTab(event.key, index, SAMPLE_HERO_REPOS.length);
    if (next === null) return;
    event.preventDefault();
    setRepoIndex(next);
    repoTabs.current[next]?.focus();
  };
  const onFileKey = (event: KeyboardEvent, index: number) => {
    const next = nextTab(event.key, index, SAMPLE_SYNC_FILES.length);
    if (next === null) return;
    event.preventDefault();
    selectFile(next);
    fileTabs.current[next]?.focus();
  };

  const repo = SAMPLE_HERO_REPOS[repoIndex]!;
  const current = SAMPLE_SYNC_FILES[file]!;
  const repoPanel = `${uid}-repo-panel`;
  const playing = mode !== "paused";

  return (
    <div
      ref={ref}
      data-testid="hero-sync"
      data-ready={hydrated ? "true" : "false"}
      onPointerEnter={onInteract}
      onFocus={onInteract}
      onClick={onInteract}
      className="min-w-0"
    >
      <ManagedFrame
        policy={SAMPLE_POLICY.slug}
        version={SAMPLE_POLICY.version}
        testIdPrefix="hero-marker"
        footnote="Everything outside these markers stays yours."
      >
        <div
          role="tablist"
          aria-label="Repositories in the rollout"
          className="flex min-w-0 [scrollbar-width:thin] gap-1.5 overflow-x-auto py-0.5"
        >
          {SAMPLE_HERO_REPOS.map((r, i) => {
            const selected = i === repoIndex;
            return (
              <button
                key={r.name}
                ref={(el) => {
                  repoTabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-repo-${i}`}
                aria-selected={selected}
                aria-controls={repoPanel}
                tabIndex={selected ? 0 : -1}
                onClick={() => setRepoIndex(i)}
                onKeyDown={(e) => onRepoKey(e, i)}
                className={cn(
                  FOCUS_INSET,
                  "bg-card text-muted-foreground inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1 pr-1.5 pl-3 font-mono text-xs transition-colors",
                  "hover:text-foreground aria-selected:border-foreground/30 aria-selected:bg-muted aria-selected:text-foreground",
                )}
              >
                {r.name}
                <RepoStatusBadge status={r.state === "merged" ? "compliant" : "pending_sync"} />
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={repoPanel} aria-labelledby={`${uid}-repo-${repoIndex}`}>
          <article aria-label="Sync pull request" className={CODE_CARD}>
            <div className="grid gap-2 border-b px-4 py-3.5 sm:px-5">
              <p className="text-muted-foreground font-mono text-xs [overflow-wrap:anywhere]">
                {SAMPLE_ORG} /{" "}
                <span data-testid="pr-repo" className="text-foreground font-medium">
                  {repo.name}
                </span>
              </p>
              <p className="text-base leading-snug font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]">
                {prTitle}{" "}
                <span data-testid="pr-number" className="text-muted-foreground font-normal">
                  #{repo.pr}
                </span>
              </p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[13px] leading-snug">
                <PrState state={repo.state} />
                {repo.state === "merged" ? (
                  <span className="min-w-0">
                    Merged into <code className={INLINE_CODE}>main</code> by a Northwind reviewer.
                    Repo is Compliant.
                  </span>
                ) : (
                  <span className="min-w-0">
                    contextops[bot] wants to merge into <code className={INLINE_CODE}>main</code>{" "}
                    from <code className={INLINE_CODE}>{branch}</code>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-b px-4 py-2.5 text-[13px] leading-snug sm:px-5">
              <CircleCheck aria-hidden className="text-success mt-px size-4 shrink-0" />
              <p className="min-w-0">
                <span className="font-medium">ContextOps / managed blocks</span>{" "}
                <span className="text-muted-foreground">
                  3 files match {policyLabel}. 0 lines changed outside the markers.
                </span>
              </p>
            </div>

            <div className="flex items-center border-b">
              <div
                role="tablist"
                aria-label="Files changed"
                className="flex min-w-0 flex-1 [scrollbar-width:thin] gap-0.5 overflow-x-auto px-2.5"
              >
                {SAMPLE_SYNC_FILES.map((f, i) => {
                  const selected = i === file;
                  const { added, removed } = diffCounts(f.lines);
                  return (
                    <button
                      key={f.name}
                      ref={(el) => {
                        fileTabs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={ids.tab(i)}
                      aria-selected={selected}
                      aria-controls={ids.panel}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectFile(i)}
                      onKeyDown={(e) => onFileKey(e, i)}
                      className={cn(
                        FOCUS_INSET,
                        "text-muted-foreground inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 border-transparent px-2 pt-2.5 pb-2 font-mono text-xs whitespace-nowrap transition-colors",
                        "hover:text-foreground aria-selected:border-foreground aria-selected:text-foreground",
                      )}
                    >
                      {f.name}
                      {f.isNew ? (
                        <span className="text-info rounded border border-current px-1 text-[10.5px] leading-4">
                          new
                        </span>
                      ) : null}
                      <span aria-hidden className="text-[11.5px] tabular-nums">
                        <span className="text-success">+{added}</span>{" "}
                        <span className="text-destructive">−{removed}</span>
                      </span>
                      <span className="sr-only">
                        , {added} added, {removed} removed
                      </span>
                    </button>
                  );
                })}
              </div>
              {motionOk ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  data-autoplay-toggle
                  aria-label={playing ? "Pause file tabs" : "Play file tabs"}
                  title={playing ? "Pause file tabs" : "Play file tabs"}
                  onClick={togglePlay}
                  className="text-muted-foreground mx-2 shrink-0"
                >
                  {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
                </Button>
              ) : null}
            </div>

            <div
              role="tabpanel"
              id={ids.panel}
              aria-labelledby={ids.tab(file)}
              tabIndex={0}
              className={cn(FOCUS_INSET, CODE_TEXT, "overflow-x-auto py-2")}
              style={{ minHeight: PANEL_MIN_HEIGHT }}
            >
              <div
                key={file}
                className={cn(
                  changed &&
                    "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
                )}
              >
                <CodeLines lines={current.lines} />
              </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap justify-between gap-x-3 gap-y-1 border-t px-4 py-2.5 text-[12.5px] leading-snug sm:px-5">
              <span>Review and merge it yourself. ContextOps never merges.</span>
              <span className="font-mono">1 commit · 3 files</span>
            </div>
          </article>
        </div>
      </ManagedFrame>
    </div>
  );
}
