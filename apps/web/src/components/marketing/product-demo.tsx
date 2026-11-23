"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  CircleCheck,
  FileWarning,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequestArrow,
  Loader,
  Pause,
  Play,
} from "lucide-react";
import { DiffViewer } from "@/components/app/diff-viewer";
import { RolloutProgress } from "@/components/app/rollouts/rollout-progress";
import {
  RepoStatusBadge,
  RolloutItemStatusBadge,
  RolloutStatusBadge,
} from "@/components/app/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import {
  SAMPLE_DRIFT,
  SAMPLE_DRIFT_DIFF,
  SAMPLE_ORG,
  SAMPLE_POLICY,
  SAMPLE_ROLLOUT_REPOS,
} from "@/lib/sample";
import type { RepoStatus } from "@/server/data/types";
import { BrowserFrame, MockSidebar } from "./browser-frame";
import { useInView } from "./use-motion";

const policyLabel = `${SAMPLE_POLICY.name} v${SAMPLE_POLICY.version}`;
const branch = `contextops/sync-${SAMPLE_POLICY.slug}`;
const prTitle = `chore(agents): sync ${policyLabel}`;

/**
 * The scripted demo. Each scene is a list of tick durations (ms); the last tick is the
 * scene's finished state, held for `holdMs` before the next scene. The finished state is
 * also what reduced motion, a paused demo and the server HTML show.
 */
const SCENES = [
  {
    id: "rollout",
    label: "Roll out",
    nav: "Rollouts",
    path: `/app/${SAMPLE_ORG}/rollouts`,
    ticks: [900, 900, 900, 900, 900, 900, 900, 900, 0],
    holdMs: 2600,
    caption: `${policyLabel} rolls out to six Northwind Labs repositories. Each repo gets one sync pull request, and turns Compliant only when that PR is merged.`,
  },
  {
    id: "drift",
    label: "Detect drift",
    nav: "Repositories",
    path: `/app/${SAMPLE_ORG}/repositories/${SAMPLE_DRIFT.repo}`,
    ticks: [1500, 1300, 1300, 0],
    holdMs: 3800,
    caption: `Someone edits the managed block in ${SAMPLE_DRIFT.repo}'s ${SAMPLE_DRIFT.file} directly on main. The push triggers a re-check, and the repo flips to Drifted with the exact diff.`,
  },
  {
    id: "remediate",
    label: "Remediate",
    nav: "Repositories",
    path: `/app/${SAMPLE_ORG}/repositories/${SAMPLE_DRIFT.repo}`,
    ticks: [1700, 1100, 1600, 0],
    holdMs: 2800,
    caption: `Open remediation PR re-renders the block on ${branch}. ContextOps never merges: after your review and merge, ${SAMPLE_DRIFT.repo} is Compliant again.`,
  },
] as const;

type DemoState = { scene: number; tick: number; fresh: boolean };

/**
 * True once the visitor has pressed play or picked a step. Until then nothing in the demo
 * animates: the page loads on the rollout's finished state, so the only motion a visitor
 * didn't ask for is the hero's.
 */
const Animate = createContext(false);
const ENTER = "motion-safe:animate-in motion-safe:fade-in-0";

const lastTick = (scene: number) => SCENES[scene]!.ticks.length - 1;

/**
 * Mock of the app: a rollout, a drift, and its remediation. It starts paused on the rollout's
 * finished state (also the server HTML) and plays only when the visitor presses Play. While
 * playing it pauses itself off screen.
 */
export function ProductDemo() {
  const hydrated = useHydrated();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [playing, setPlaying] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [state, setState] = useState<DemoState>({ scene: 0, tick: lastTick(0), fresh: true });

  const active = playing && inView;
  const { scene, tick, fresh } = state;

  useEffect(() => {
    if (!active) return;
    const current = SCENES[scene]!;
    let delay: number;
    let next: DemoState;
    if (fresh) {
      // First play: replay the rollout from the start.
      delay = 500;
      next = { scene, tick: 0, fresh: false };
    } else if (tick < lastTick(scene)) {
      delay = current.ticks[tick]!;
      next = { scene, tick: tick + 1, fresh: false };
    } else {
      delay = current.holdMs;
      next = { scene: (scene + 1) % SCENES.length, tick: 0, fresh: false };
    }
    const id = setTimeout(() => setState(next), delay);
    return () => clearTimeout(id);
  }, [active, scene, tick, fresh]);

  const selectScene = (id: string) => {
    const index = SCENES.findIndex((s) => s.id === id);
    if (index < 0) return;
    setInteracted(true);
    // Playing: run the scene from its start. Paused: show its finished state.
    setState({ scene: index, tick: playing ? 0 : lastTick(index), fresh: false });
  };

  const current = SCENES[scene]!;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="ContextOps product demo"
      data-ready={hydrated ? "true" : "false"}
      className="min-w-0"
    >
      <Tabs value={current.id} onValueChange={selectScene} className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList aria-label="Demo steps" className="max-w-full">
            {SCENES.map((s, i) => (
              <TabsTrigger key={s.id} value={s.id} className="px-2.5">
                <span
                  aria-hidden
                  className="bg-muted-foreground/15 inline-flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums"
                >
                  {i + 1}
                </span>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={playing ? "Pause demo" : "Play demo"}
            onClick={() => {
              setInteracted(true);
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            {playing ? "Pause" : "Play"}
          </Button>
        </div>

        <Animate.Provider value={interacted}>
          <BrowserFrame path={current.path}>
            <div className="flex min-w-0">
              <MockSidebar active={current.nav} />
              <div className="min-h-[27rem] min-w-0 flex-1 p-3 sm:p-4">
                <TabsContent value="rollout">
                  <RolloutScene tick={scene === 0 ? tick : lastTick(0)} />
                </TabsContent>
                <TabsContent value="drift">
                  <DriftScene tick={scene === 1 ? tick : lastTick(1)} />
                </TabsContent>
                <TabsContent value="remediate">
                  <RemediateScene tick={scene === 2 ? tick : lastTick(2)} />
                </TabsContent>
              </div>
            </div>
          </BrowserFrame>
        </Animate.Provider>

        <p className="text-muted-foreground min-h-10 max-w-[68ch] text-sm leading-relaxed">
          {current.caption}
        </p>
      </Tabs>
    </div>
  );
}

/** Re-mounts on `id`, so a changed status fades in instead of snapping. */
function Swap({ id, children }: { id: string; children: ReactNode }) {
  const animate = useContext(Animate);
  return (
    <span
      key={id}
      className={cn(
        "inline-flex",
        animate && `${ENTER} motion-safe:zoom-in-95 motion-safe:duration-300`,
      )}
    >
      {children}
    </span>
  );
}

function SceneHeader({
  crumb,
  title,
  badge,
  meta,
}: {
  crumb: string;
  title: string;
  badge: ReactNode;
  meta: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{crumb}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="min-w-0 truncate font-semibold">{title}</p>
        {badge}
      </div>
      <p className="text-muted-foreground truncate text-xs">{meta}</p>
    </div>
  );
}

// ── Scene 1: rollout ────────────────────────────────────────────────────────────

type Stage = "queued" | "open" | "merged";

/** Repo i opens its PR at tick i + 1 and merges two ticks later. */
const stageAt = (tick: number, i: number): Stage =>
  tick < i + 1 ? "queued" : tick < i + 3 ? "open" : "merged";

function RolloutScene({ tick }: { tick: number }) {
  const rows = SAMPLE_ROLLOUT_REPOS.map((r, i) => ({ ...r, stage: stageAt(tick, i) }));
  const merged = rows.filter((r) => r.stage === "merged").length;
  const open = rows.filter((r) => r.stage === "open").length;
  const total = rows.length;
  const done = merged === total;

  return (
    <div className="space-y-4">
      <SceneHeader
        crumb="Rollouts"
        title={policyLabel}
        badge={
          <Swap id={done ? "done" : "running"}>
            <RolloutStatusBadge status={done ? "completed" : "running"} />
          </Swap>
        }
        meta={`${total} repositories · AGENTS.md, CLAUDE.md, Copilot instructions`}
      />
      <div className="space-y-1.5">
        <RolloutProgress
          counts={{
            total,
            merged,
            prOpen: open,
            upToDate: 0,
            failed: 0,
            skipped: 0,
            inProgress: 0,
          }}
        />
        <p className="text-muted-foreground text-xs tabular-nums">
          {merged} of {total} merged{open ? ` · ${open} PR open` : ""}
        </p>
      </div>
      <ul className="divide-y rounded-md border">
        {rows.map((row) => {
          const status: RepoStatus = row.stage === "merged" ? "compliant" : "pending_sync";
          return (
            <li key={row.name} className="flex items-center gap-3 px-3 py-2">
              <FolderGit2 aria-hidden className="text-muted-foreground size-4 shrink-0" />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  {row.stage === "queued" ? (
                    "Queued"
                  ) : (
                    <>
                      <GitPullRequestArrow aria-hidden className="size-3 shrink-0" />
                      <span className="truncate">
                        PR #{row.pr} {row.stage === "open" ? "opened" : "merged"}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <Swap id={status}>
                <RepoStatusBadge status={status} />
              </Swap>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Scene 2: drift ──────────────────────────────────────────────────────────────

const repoMeta = `${SAMPLE_ORG} · ${policyLabel} · TypeScript`;

function ActivityItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  const animate = useContext(Animate);
  return (
    <li
      className={cn(
        "flex items-start gap-2 px-3 py-2 text-xs",
        animate && `${ENTER} motion-safe:slide-in-from-top-1`,
      )}
    >
      <span className="text-muted-foreground mt-px shrink-0">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function DriftDiff() {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-warning flex items-center gap-1.5 text-xs font-medium">
        <FileWarning aria-hidden className="size-3.5" />
        {SAMPLE_DRIFT.file} managed block changed outside ContextOps
      </p>
      <div className="max-h-56 min-w-0 overflow-auto">
        <DiffViewer diff={SAMPLE_DRIFT_DIFF} />
      </div>
    </div>
  );
}

function DriftScene({ tick }: { tick: number }) {
  const drifted = tick >= 3;
  return (
    <div className="space-y-4">
      <SceneHeader
        crumb="Repositories"
        title={SAMPLE_DRIFT.repo}
        badge={
          <Swap id={drifted ? "drifted" : "compliant"}>
            <RepoStatusBadge status={drifted ? "drifted" : "compliant"} />
          </Swap>
        }
        meta={repoMeta}
      />
      <ul className="divide-y rounded-md border">
        <ActivityItem icon={<CircleCheck className="size-3.5" />}>
          PR #{SAMPLE_DRIFT.syncPr} merged: {prTitle}
        </ActivityItem>
        {tick >= 1 ? (
          <ActivityItem icon={<GitCommitHorizontal className="size-3.5" />}>
            {SAMPLE_DRIFT.editor} pushed to main: &ldquo;Update {SAMPLE_DRIFT.file}&rdquo;
          </ActivityItem>
        ) : null}
        {tick === 2 ? (
          <ActivityItem icon={<Loader className="size-3.5 motion-safe:animate-spin" />}>
            Comparing managed blocks with the expected render…
          </ActivityItem>
        ) : null}
        {tick >= 3 ? (
          <ActivityItem icon={<FileWarning className="size-3.5" />}>
            Hash mismatch in {SAMPLE_DRIFT.file}: repo marked Drifted
          </ActivityItem>
        ) : null}
      </ul>
      {drifted ? <DriftDiff /> : null}
    </div>
  );
}

// ── Scene 3: remediate ──────────────────────────────────────────────────────────

function RemediateScene({ tick }: { tick: number }) {
  const animate = useContext(Animate);
  const status: RepoStatus = tick <= 1 ? "drifted" : tick === 2 ? "pending_sync" : "compliant";
  const pressed = tick === 1;
  return (
    <div className="space-y-4">
      <SceneHeader
        crumb="Repositories"
        title={SAMPLE_DRIFT.repo}
        badge={
          <Swap id={status}>
            <RepoStatusBadge status={status} />
          </Swap>
        }
        meta={repoMeta}
      />
      {/* Inert copies of the repo page's three remediation actions. */}
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            buttonVariants({ size: "sm" }),
            "transition-all",
            pressed && "ring-ring/60 scale-[0.97] ring-3",
            tick >= 2 && "opacity-60",
          )}
        >
          {pressed ? (
            <Loader aria-hidden className="motion-safe:animate-spin" />
          ) : (
            <GitPullRequestArrow aria-hidden />
          )}
          Open remediation PR
        </span>
        <span
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "hidden sm:inline-flex",
          )}
        >
          Accept as repo notes
        </span>
        <span className={buttonVariants({ size: "sm", variant: "outline" })}>Mark exempt</span>
      </div>
      {tick <= 1 ? (
        <DriftDiff />
      ) : (
        <div className={cn("space-y-2 rounded-md border p-3", animate && ENTER)}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <GitPullRequestArrow aria-hidden className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 truncate text-sm font-medium">
              #{SAMPLE_DRIFT.remediationPr} {prTitle}
            </span>
            <Swap id={tick >= 3 ? "merged" : "open"}>
              <RolloutItemStatusBadge status={tick >= 3 ? "merged" : "pr_open"} />
            </Swap>
          </div>
          <p className="text-muted-foreground truncate font-mono text-xs">{branch} → main</p>
          <p className="text-muted-foreground text-xs">
            Restores the managed block in {SAMPLE_DRIFT.file}. Content outside the markers is
            untouched.
          </p>
          {tick >= 3 ? (
            <p className="text-success flex items-center gap-1.5 text-xs font-medium">
              <CircleCheck aria-hidden className="size-3.5" />
              Merged by {SAMPLE_DRIFT.reviewer}. Every target file matches the policy.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
