import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { diffPolicySections, TARGETS, isTargetId } from "@contextops/policy-schema";
import { PageHeader } from "@/components/app/page-header";
import { PendingButton } from "@/components/app/pending-button";
import { PersonLabel } from "@/components/app/person-avatar";
import { PolicyContentView } from "@/components/app/policies/policy-content-view";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, plural } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { getPolicy } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export async function generateMetadata({ params }: PageProps<"/app/[ws]/policies/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  return { title: (await getPolicy(workspace.id, id))?.name ?? "Policy" };
}

export default async function PolicyPage({ params }: PageProps<"/app/[ws]/policies/[id]">) {
  const { ws, id } = await params;
  const workspace = await requireWorkspace(ws);
  const policy = await getPolicy(workspace.id, id);
  if (!policy) notFound();
  const base = wsPath(workspace.slug);
  const draftChanges =
    policy.draft && policy.content ? diffPolicySections(policy.content, policy.draft) : [];
  const targets = policy.assignments[0]?.targets ?? [];

  return (
    <>
      <Link
        href={`${base}/policies`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Policies
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {policy.name}
            {policy.currentVersion ? (
              <Badge variant="outline">v{policy.currentVersion.semver}</Badge>
            ) : null}
            {policy.hasDraft ? <Badge variant="secondary">Draft</Badge> : null}
          </span>
        }
        description={policy.description}
        actions={
          <>
            <PendingButton size="sm" variant="outline" phase={3} feature="The policy editor">
              Edit draft
            </PendingButton>
            <Button asChild size="sm">
              <Link href={`${base}/rollouts/new?policy=${policy.id}`}>
                <Send /> Roll out
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="content">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            {policy.draft ? <TabsTrigger value="draft">Draft</TabsTrigger> : null}
            <TabsTrigger value="versions">Versions ({policy.versions.length})</TabsTrigger>
            <TabsTrigger value="assignments">Assignments ({policy.assignments.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="content" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="min-w-0 lg:col-span-2">
              <CardContent>
                {policy.content ? (
                  <PolicyContentView content={policy.content} />
                ) : (
                  <p className="text-muted-foreground text-sm">No published version yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="h-fit gap-3">
              <CardHeader>
                <CardTitle className="text-sm">Renders to</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {targets.map((t) => (
                    <li key={t}>
                      <code className="font-mono text-xs">
                        {isTargetId(t) ? TARGETS[t].path : t}
                      </code>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {policy.draft ? (
          <TabsContent value="draft" className="mt-4 space-y-4">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm">Unpublished changes</CardTitle>
                <CardDescription>Compared with v{policy.currentVersion?.semver}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {draftChanges.length ? (
                  draftChanges.map((c) => (
                    <Badge key={c.section} variant="outline">
                      {c.label} · {c.change}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">
                    The draft matches the published version.
                  </span>
                )}
                <PendingButton
                  size="sm"
                  className="ml-auto"
                  phase={3}
                  feature="Publishing versions"
                >
                  Publish version
                </PendingButton>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <PolicyContentView content={policy.draft} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="versions" className="mt-4">
          <Card className="py-0">
            <ol className="divide-y">
              {policy.versions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-start sm:gap-4"
                >
                  <div className="w-24 shrink-0">
                    <Badge variant={v.id === policy.currentVersion?.id ? "default" : "outline"}>
                      v{v.semver}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p>{v.changelog}</p>
                    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      <PersonLabel person={v.publishedBy} /> · {formatDate(v.publishedAt)} ·{" "}
                      {plural(v.repoCount, "repo")} on this version
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policy.assignments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`${base}/repositories/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <RepoStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {r.appliedVersion ? `v${r.appliedVersion}` : "not synced"}
                    </TableCell>
                  </TableRow>
                ))}
                {!policy.assignments.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                      Not assigned to any repository yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
