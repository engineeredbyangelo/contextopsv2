import { Download } from "lucide-react";
import { AuditLogTable } from "@/components/app/audit-log-table";
import { PageHeader } from "@/components/app/page-header";
import { PendingButton } from "@/components/app/pending-button";
import { listAuditEvents } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage({ params }: PageProps<"/app/[ws]/audit-log">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const events = await listAuditEvents(workspace.id);
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every publish, assignment, rollout, exemption, role change and GitHub connection"
        actions={
          <PendingButton size="sm" variant="outline" phase={4} feature="CSV export">
            <Download /> Export CSV
          </PendingButton>
        }
      />
      <AuditLogTable events={events} />
    </>
  );
}
