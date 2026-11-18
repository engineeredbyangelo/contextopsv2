import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RolloutWizard } from "@/components/app/rollouts/rollout-wizard";
import { wsPath } from "@/lib/nav";
import { listPolicyVersionOptions, listRepositories } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "New rollout" };

export default async function NewRolloutPage({
  params,
  searchParams,
}: PageProps<"/app/[ws]/rollouts/new">) {
  const [{ ws }, sp] = await Promise.all([params, searchParams]);
  const workspace = await requireWorkspace(ws);
  const [options, repos] = await Promise.all([
    listPolicyVersionOptions(workspace.id),
    listRepositories(workspace.id),
  ]);
  const policyId = typeof sp.policy === "string" ? sp.policy : null;
  return (
    <>
      <Link
        href={`${wsPath(workspace.slug)}/rollouts`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Rollouts
      </Link>
      <PageHeader
        title="New rollout"
        description="Open or update one sync pull request per repository. Nothing merges without review."
      />
      <RolloutWizard options={options} repos={repos} initialPolicyId={policyId} />
    </>
  );
}
