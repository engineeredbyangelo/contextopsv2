import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileCheck2,
  FileWarning,
  FileX2,
  FilePen,
  GitPullRequestArrow,
} from "lucide-react";
import { ActivityList } from "@/components/app/activity-list";
import { DiffViewer } from "@/components/app/diff-viewer";
import { PageHeader } from "@/components/app/page-header";
import { PendingButton } from "@/components/app/pending-button";
import { PersonLabel } from "@/components/app/person-avatar";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { REPO_STATUS } from "@/lib/status";
import { getRepository } from "@/server/data";
import type { FileState, RepoDetail } from "@/server/data/types";
import { requireWorkspace } from "@/server/workspace";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: PageProps<"/app/[ws]/repositories/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  const repo = await getRepository(workspace.id, id);
  return { title: repo?.fullName ?? "Repository" };
}

const FILE_STATE: Record<
  FileState["state"],
  { label: string; icon: typeof FileCheck2; className: string }
> = {
  in_sync: { label: "In sync", icon: FileCheck2, className: "text-success" },
  drifted: { label: "Drifted", icon: FileWarning, className: "text-warning" },
  missing: { label: "Not created yet", icon: FileX2, className: "text-muted-foreground" },
  unmanaged: { label: "No managed block", icon: FilePen, className: "text-muted-foreground" },
};

export default async function RepositoryPage({ params }: PageProps<"/app/[ws]/repositories/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  const repo = await getRepository(workspace.id, id);
  if (!repo) notFound();
  const base = wsPath(workspace.slug);
  const drifted = repo.files.filter((f) => f.driftDiff);

  return (
    <>
      <Link
        href={`${base}/repositories`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Repositories
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="break-all">{repo.fullName}</span>
            <RepoStatusBadge status={repo.status} />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="capitalize">{repo.visibility}</span>
            {repo.language ? <span>{repo.language}</span> : null}
            <span>
              Default branch <code className="font-mono text-xs">{repo.defaultBranch}</code>
            </span>
            <a
              href={`https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="size-3" />
            </a>
          </span>
        }
        actions={<RepoActions repo={repo} />}
      />

      <StatusAlert repo={repo} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Agent files</CardTitle>
              <CardDescription>
                {repo.policy ? (
                  <>
                    <Link href={`${base}/policies/${repo.policy.id}`} className="hover:underline">
                      {repo.policy.name}
                    </Link>
                    {repo.expectedVersion ? ` v${repo.expectedVersion}` : ""}
                  </>
                ) : (
                  "No policy assigned"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {repo.files.map((f) => {
                  const s = FILE_STATE[f.state];
                  return (
                    <li key={f.target} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                      <s.icon className={`size-4 shrink-0 ${s.className}`} aria-hidden />
                      <code className="min-w-0 flex-1 truncate font-mono text-xs">{f.path}</code>
                      <span className="text-muted-foreground text-xs">{s.label}</span>
                      {f.appliedVersion ? (
                        <Badge variant="outline">v{f.appliedVersion}</Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {drifted.length ? (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm">Drift</CardTitle>
                <CardDescription>
                  Edits made inside the managed block since the last sync.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {drifted.map((f) => (
                  <DiffViewer key={f.target} diff={f.driftDiff!} />
                ))}
                <div className="flex flex-wrap gap-2">
                  <PendingButton size="sm" phase={3} feature="Re-sync">
                    Re-sync
                  </PendingButton>
                  <PendingButton
                    size="sm"
                    variant="outline"
                    phase={3}
                    feature="Accept as repo notes"
                  >
                    Accept as repo notes
                  </PendingButton>
                  <PendingButton size="sm" variant="ghost" phase={3} feature="Exemptions">
                    Mark exempt
                  </PendingButton>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Sync pull requests</CardTitle>
            </CardHeader>
            <CardContent>
              {repo.pullRequests.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pull request</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Opened</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repo.pullRequests.map((pr) => (
                        <TableRow key={pr.id}>
                          <TableCell>
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              <span className="text-muted-foreground">#{pr.number}</span> {pr.title}
                            </a>
                          </TableCell>
                          <TableCell className="capitalize">{pr.state}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(pr.openedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  ContextOps hasn&apos;t opened a pull request here yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Variables</CardTitle>
              <CardDescription>
                Fill <code className="font-mono text-xs">{"{{placeholders}}"}</code> in the policy
              </CardDescription>
              <CardAction>
                <PendingButton size="sm" variant="ghost" phase={3} feature="Editing variables">
                  Edit
                </PendingButton>
              </CardAction>
            </CardHeader>
            <CardContent>
              {Object.keys(repo.variables).length ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {Object.entries(repo.variables).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground font-mono text-xs">{k}</dt>
                      <dd className="font-mono text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No variables. Defaults come from the first scan.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {repo.activity.length ? (
                <ActivityList events={repo.activity} />
              ) : (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function RepoActions({ repo }: { repo: RepoDetail }) {
  if (repo.status === "sync_failed") {
    return (
      <PendingButton size="sm" phase={3} feature="Retry">
        Retry sync
      </PendingButton>
    );
  }
  if (repo.status === "unassigned") {
    return (
      <PendingButton size="sm" phase={3} feature="Assigning policies">
        Assign policy
      </PendingButton>
    );
  }
  if (repo.status === "exempted") {
    return (
      <PendingButton size="sm" variant="outline" phase={3} feature="Exemptions">
        End exemption
      </PendingButton>
    );
  }
  if (repo.status === "disconnected") return null;
  return (
    <PendingButton size="sm" variant="outline" phase={3} feature="Exemptions">
      Mark exempt
    </PendingButton>
  );
}

function StatusAlert({ repo }: { repo: RepoDetail }) {
  const meta = REPO_STATUS[repo.status];
  const body = (() => {
    switch (repo.status) {
      case "sync_failed":
        return repo.error
          ? {
              title: "The last sync failed",
              text: repo.error.message,
              variant: "destructive" as const,
            }
          : null;
      case "pending_sync":
        return repo.openPr
          ? {
              title: "Sync pull request open",
              text: (
                <>
                  Merge{" "}
                  <a className="underline" href={repo.openPr.url} target="_blank" rel="noreferrer">
                    PR #{repo.openPr.number}
                  </a>{" "}
                  to make this repo compliant.
                </>
              ),
            }
          : { title: "Waiting to sync", text: "A rollout will open a pull request for this repo." };
      case "exempted":
        return repo.exemption
          ? {
              title: `Exempted${repo.exemption.expiresAt ? ` until ${formatDate(repo.exemption.expiresAt)}` : ""}`,
              text: (
                <span className="space-y-1">
                  <span className="block">{repo.exemption.reason}</span>
                  <span className="block text-xs">
                    By <PersonLabel person={repo.exemption.createdBy} />
                  </span>
                </span>
              ),
            }
          : null;
      case "disconnected":
        return {
          title: "ContextOps lost access to this repository",
          text: `Since ${formatDateTime(repo.disconnectedAt)}. Re-add it to the ${repo.installation.accountLogin} installation to resume syncing. History is kept.`,
        };
      case "unassigned":
        return {
          title: "No policy assigned",
          text: "Assign a policy to start managing this repo's agent files.",
        };
      default:
        return null;
    }
  })();
  if (!body) return null;
  return (
    <Alert variant={"variant" in body ? body.variant : "default"} className="mb-4">
      {repo.status === "pending_sync" ? <GitPullRequestArrow /> : <meta.icon />}
      <AlertTitle>{body.title}</AlertTitle>
      <AlertDescription>{body.text}</AlertDescription>
    </Alert>
  );
}
