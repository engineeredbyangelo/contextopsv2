import { Building2, GitBranch } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PendingButton } from "@/components/app/pending-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, plural } from "@/lib/format";
import { listInstallations } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Integrations" };

const PERMISSIONS = [
  ["Metadata", "Read", "List repos, default branch, visibility"],
  ["Contents", "Read & write", "Read agent files; create branches and commits"],
  ["Pull requests", "Read & write", "Open, update and track sync PRs"],
] as const;

export default async function IntegrationsPage({
  params,
}: PageProps<"/app/[ws]/settings/integrations">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const installations = await listInstallations(workspace.id);
  const connect = (
    <PendingButton size="sm" phase={2} feature="Connecting GitHub orgs">
      <GitBranch /> Connect GitHub organization
    </PendingButton>
  );
  return (
    <div className="space-y-4">
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-sm">GitHub organizations</CardTitle>
          <CardDescription>
            ContextOps acts through the GitHub App installed on each org, never a person&apos;s
            token.
          </CardDescription>
          <CardAction>{connect}</CardAction>
        </CardHeader>
        <CardContent>
          {installations.length ? (
            <ul className="divide-y">
              {installations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <span className="bg-muted flex size-8 items-center justify-center rounded-md">
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{i.accountLogin}</div>
                    <div className="text-muted-foreground text-xs">
                      {i.repoSelection === "all" ? "All repositories" : "Selected repositories"} ·{" "}
                      {plural(i.repoCount, "repo")} · connected {formatDate(i.connectedAt)}
                    </div>
                  </div>
                  <Badge
                    variant={i.state === "active" ? "outline" : "destructive"}
                    className="capitalize"
                  >
                    {i.state}
                  </Badge>
                  <PendingButton
                    size="xs"
                    variant="ghost"
                    phase={2}
                    feature="Managing installations"
                  >
                    Configure
                  </PendingButton>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={GitBranch}
              title="No GitHub organizations connected"
              description="An org admin installs the ContextOps app and picks all or selected repositories."
              action={connect}
            />
          )}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-sm">App permissions</CardTitle>
          <CardDescription>
            Least privilege. ContextOps stores agent files and metadata only, never other source
            code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {PERMISSIONS.map(([name, access, use]) => (
              <div key={name} className="flex flex-wrap gap-x-3">
                <dt className="w-28 font-medium">{name}</dt>
                <dd className="text-muted-foreground w-28">{access}</dd>
                <dd className="text-muted-foreground min-w-0 flex-1">{use}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
