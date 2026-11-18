import Link from "next/link";
import { Send } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { RolloutTable } from "@/components/app/rollouts/rollout-table";
import { Button } from "@/components/ui/button";
import { wsPath } from "@/lib/nav";
import { listRollouts } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Rollouts" };

export default async function RolloutsPage({ params }: PageProps<"/app/[ws]/rollouts">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const rollouts = await listRollouts(workspace.id);
  const base = wsPath(workspace.slug);
  const newButton = (
    <Button asChild size="sm">
      <Link href={`${base}/rollouts/new`}>
        <Send /> New rollout
      </Link>
    </Button>
  );
  return (
    <>
      <PageHeader
        title="Rollouts"
        description="Each rollout opens or updates one sync pull request per repository"
        actions={newButton}
      />
      {rollouts.length ? (
        <RolloutTable rollouts={rollouts} base={base} />
      ) : (
        <EmptyState
          icon={Send}
          title="No rollouts yet"
          description="Roll a published policy out to your repositories to open sync pull requests."
          action={newButton}
        />
      )}
    </>
  );
}
