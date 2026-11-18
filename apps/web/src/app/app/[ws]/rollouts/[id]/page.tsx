import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TARGETS, isTargetId } from "@contextops/policy-schema";
import { PageHeader } from "@/components/app/page-header";
import { PendingButton } from "@/components/app/pending-button";
import { PersonLabel } from "@/components/app/person-avatar";
import { RolloutProgress } from "@/components/app/rollouts/rollout-progress";
import { RolloutItemStatusBadge, RolloutStatusBadge } from "@/components/app/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { getRollout } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export async function generateMetadata({ params }: PageProps<"/app/[ws]/rollouts/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  const r = await getRollout(workspace.id, id);
  return { title: r ? `${r.policy.name} v${r.semver} rollout` : "Rollout" };
}

export default async function RolloutPage({ params }: PageProps<"/app/[ws]/rollouts/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  const rollout = await getRollout(workspace.id, id);
  if (!rollout) notFound();
  const base = wsPath(workspace.slug);
  const c = rollout.counts;
  const stats = [
    { label: "Repositories", value: c.total },
    { label: "Merged", value: c.merged + c.upToDate },
    { label: "PR open", value: c.prOpen + c.inProgress },
    { label: "Failed", value: c.failed },
    { label: "Skipped", value: c.skipped },
  ];

  return (
    <>
      <Link
        href={`${base}/rollouts`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Rollouts
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {rollout.policy.name} v{rollout.semver}
            <RolloutStatusBadge status={rollout.status} />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <PersonLabel person={rollout.createdBy} /> · started {formatDateTime(rollout.startedAt)}
            {rollout.finishedAt ? <> · finished {formatDateTime(rollout.finishedAt)}</> : null}
            <span>
              · {rollout.targets.map((t) => (isTargetId(t) ? TARGETS[t].label : t)).join(", ")}
            </span>
          </span>
        }
        actions={
          c.failed ? (
            <PendingButton size="sm" phase={3} feature="Retrying failed repos">
              Retry failed
            </PendingButton>
          ) : null
        }
      />

      <Card className="mb-4 gap-4">
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-muted-foreground text-xs">{s.label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <RolloutProgress counts={c} />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Pull request</TableHead>
              <TableHead className="min-w-64">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rollout.items.map((i) => (
              <TableRow key={i.id} className="align-top">
                <TableCell>
                  <Link
                    href={`${base}/repositories/${i.repo.id}`}
                    className="font-medium whitespace-nowrap hover:underline"
                  >
                    {i.repo.fullName}
                  </Link>
                </TableCell>
                <TableCell>
                  <RolloutItemStatusBadge status={i.status} />
                </TableCell>
                <TableCell>
                  {i.branch ? (
                    <code className="font-mono text-xs whitespace-nowrap">{i.branch}</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {i.prUrl ? (
                    <a
                      href={i.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      #{i.prNumber} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {i.errorMessage ? (
                    <div className="space-y-2">
                      <p className="text-sm">{i.errorMessage}</p>
                      <PendingButton size="xs" variant="outline" phase={3} feature="Retry">
                        Retry
                      </PendingButton>
                    </div>
                  ) : i.status === "skipped" ? (
                    <span className="text-muted-foreground text-sm">
                      Exempted or disconnected when the rollout ran.
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
