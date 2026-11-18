import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { NewPolicyForm } from "@/components/app/policies/new-policy-form";
import { wsPath } from "@/lib/nav";
import { listImportCandidates } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "New policy" };

export default async function NewPolicyPage({ params }: PageProps<"/app/[ws]/policies/new">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const candidates = await listImportCandidates(workspace.id);
  return (
    <>
      <Link
        href={`${wsPath(workspace.slug)}/policies`}
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Policies
      </Link>
      <PageHeader
        title="New policy"
        description="Policies start as a private draft. Nothing reaches a repo until you publish and roll out."
      />
      <NewPolicyForm candidates={candidates} />
    </>
  );
}
