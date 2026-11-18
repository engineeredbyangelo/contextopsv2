import Link from "next/link";
import { ArrowRight, Circle, CircleCheck, GitPullRequestArrow, Send } from "lucide-react";
import { ActivityList } from "@/components/app/activity-list";
import { PageHeader } from "@/components/app/page-header";
import { RepoStatusBadge, RolloutStatusBadge } from "@/components/app/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, plural } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { REPO_STATUS, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import { getOverview } from "@/server/data";
import type { RepoStatus } from "@/server/data/types";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Overview" };

const KPI_STATUSES: RepoStatus[] = [
  "compliant",
  "drifted",
  "pending_sync",
  "sync_failed",
  "exempted",
];

export default async function OverviewPage({ params }: PageProps<"/app/[ws]">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const o = await getOverview(workspace.id);
  const base = wsPath(workspace.slug);
  const evaluated = o.total - o.counts.exempted - o.counts.unassigned - o.counts.disconnected;
  const rate = evaluated ? Math.round((o.counts.compliant / evaluated) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${rate}% of ${plural(evaluated, "evaluated repository", "evaluated repositories")} compliant`}
        actions={
          <Button asChild size="sm">
            <Link href={`${base}/rollouts/new`}>
              <Send /> New rollout
            </Link>
          </Button>
        }
      />

      {!o.setup.firstPrMerged ? <SetupChecklist setup={o.setup} base={base} /> : null}

      {o.suggestions.map((s) => (
        <Alert key={s.policy.id} className="mb-4">
          <GitPullRequestArrow />
          <AlertTitle>
            {plural(s.repoCount, "repo is", "repos are")} on {s.policy.name} v{s.behindVersion}
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>v{s.currentVersion} is published and these repos track the latest version.</span>
            <Button asChild size="sm" variant="outline">
              <Link href={`${base}/rollouts/new?policy=${s.policy.id}`}>
                Roll out v{s.currentVersion} <ArrowRight />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      <section aria-label="Compliance" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {KPI_STATUSES.map((status) => {
          const meta = REPO_STATUS[status];
          return (
            <Link
              key={status}
              href={`${base}/repositories?status=${status}`}
              className="group hover:bg-muted/50 focus-visible:ring-ring rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded border",
                    TONE_CLASSES[meta.tone],
                  )}
                >
                  <meta.icon className="size-2.5" aria-hidden />
                </span>
                {meta.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{o.counts[status]}</div>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 gap-2">
          <CardHeader>
            <CardTitle className="text-sm">Needs attention</CardTitle>
            <CardDescription>Drifted files and failed syncs</CardDescription>
          </CardHeader>
          <CardContent>
            {o.attention.length ? (
              <ul className="divide-y">
                {o.attention.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`${base}/repositories/${r.id}`}
                      className="flex items-center gap-3 py-2.5 text-sm hover:underline"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{r.fullName}</span>
                      <RepoStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Nothing needs attention. Every assigned repo is in sync.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-2">
          <CardHeader>
            <CardTitle className="text-sm">Recent rollouts</CardTitle>
            <CardDescription>
              <Link href={`${base}/rollouts`} className="hover:underline">
                View all
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {o.recentRollouts.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${base}/rollouts/${r.id}`}
                    className="flex items-center gap-3 py-2.5 text-sm hover:underline"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{r.policy.name}</span>{" "}
                      <span className="text-muted-foreground">v{r.semver}</span>
                    </span>
                    <span className="text-muted-foreground hidden text-xs sm:inline">
                      {formatDate(r.startedAt)}
                    </span>
                    <RolloutStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
            <CardDescription>
              <Link href={`${base}/audit-log`} className="hover:underline">
                Open audit log
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityList events={o.activity} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SetupChecklist({
  setup,
  base,
}: {
  setup: {
    connected: boolean;
    policyPublished: boolean;
    assigned: boolean;
    firstPrMerged: boolean;
  };
  base: string;
}) {
  const steps = [
    {
      done: setup.connected,
      label: "Connect a GitHub organization",
      href: `${base}/settings/integrations`,
    },
    {
      done: setup.policyPublished,
      label: "Publish your first policy",
      href: `${base}/policies/new`,
    },
    { done: setup.assigned, label: "Assign it to repositories", href: `${base}/rollouts/new` },
    {
      done: setup.firstPrMerged,
      label: "Merge your first sync pull request",
      href: `${base}/rollouts`,
    },
  ];
  return (
    <Card className="mb-4 gap-2">
      <CardHeader>
        <CardTitle className="text-sm">Finish setting up</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-2 text-sm hover:underline">
                {s.done ? (
                  <CircleCheck className="text-success size-4" />
                ) : (
                  <Circle className="text-muted-foreground size-4" />
                )}
                <span className={cn(s.done && "text-muted-foreground line-through")}>
                  {s.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
