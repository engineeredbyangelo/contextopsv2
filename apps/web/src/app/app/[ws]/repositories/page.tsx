import { FolderGit2, Plug } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { RepositoryTable } from "@/components/app/repositories/repository-table";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/format";
import { wsPath } from "@/lib/nav";
import { REPO_STATUS } from "@/lib/status";
import { listRepositories } from "@/server/data";
import type { RepoStatus } from "@/server/data/types";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Repositories" };

export default async function RepositoriesPage({
  params,
  searchParams,
}: PageProps<"/app/[ws]/repositories">) {
  const [{ ws }, sp] = await Promise.all([params, searchParams]);
  const workspace = await requireWorkspace(ws);
  const repos = await listRepositories(workspace.id);
  const base = wsPath(workspace.slug);
  const status =
    typeof sp.status === "string" && sp.status in REPO_STATUS ? (sp.status as RepoStatus) : null;
  const orgs = new Set(repos.map((r) => r.owner)).size;

  return (
    <>
      <PageHeader
        title="Repositories"
        description={`${plural(repos.length, "repository", "repositories")} across ${plural(orgs, "GitHub org")}`}
      />
      {repos.length ? (
        <RepositoryTable repos={repos} base={base} initialStatus={status} />
      ) : (
        <EmptyState
          icon={FolderGit2}
          title="No repositories yet"
          description="Connect a GitHub organization and ContextOps will list its repositories here."
          action={
            <Button asChild>
              <Link href={`${base}/settings/integrations`}>
                <Plug /> Connect GitHub
              </Link>
            </Button>
          }
        />
      )}
    </>
  );
}
