import Link from "next/link";
import { FileCode2, Plus } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, plural } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { listPolicies } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Policies" };

export default async function PoliciesPage({ params }: PageProps<"/app/[ws]/policies">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const policies = await listPolicies(workspace.id);
  const base = wsPath(workspace.slug);
  const newButton = (
    <Button asChild size="sm">
      <Link href={`${base}/policies/new`}>
        <Plus /> New policy
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Policies"
        description="Versioned rules rendered into each repo's agent files"
        actions={newButton}
      />
      {policies.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((p) => (
            <Link
              key={p.id}
              href={`${base}/policies/${p.id}`}
              className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="group-hover:bg-muted/40 h-full gap-3 transition-colors">
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                    {p.name}
                    {p.currentVersion ? (
                      <Badge variant="outline">v{p.currentVersion.semver}</Badge>
                    ) : null}
                    {p.hasDraft ? <Badge variant="secondary">Draft</Badge> : null}
                  </CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground mt-auto space-y-2 text-xs">
                  <p>
                    {plural(p.repoCount, "repo")} assigned
                    {p.versionsInUse.length ? " · " : ""}
                    {p.versionsInUse.map((v) => `${v.count} on v${v.semver}`).join(", ")}
                  </p>
                  <p>Updated {formatDate(p.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCode2}
          title="No policies yet"
          description="Import an existing AGENTS.md or CLAUDE.md, start from a template, or write one from scratch."
          action={newButton}
        />
      )}
    </>
  );
}
