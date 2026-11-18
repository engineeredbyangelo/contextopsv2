import { InviteDialog } from "@/components/app/settings/invite-dialog";
import { PersonAvatar } from "@/components/app/person-avatar";
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
import { formatDate } from "@/lib/format";
import { listInvitations, listMembers } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Team" };

export default async function TeamPage({ params }: PageProps<"/app/[ws]/settings/team">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const [members, invitations] = await Promise.all([
    listMembers(workspace.id),
    listInvitations(workspace.id),
  ]);
  return (
    <div className="space-y-4">
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-sm">Members</CardTitle>
          <CardDescription>
            Seats are free. Plans are priced by connected repositories.
          </CardDescription>
          <CardAction>
            <InviteDialog />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <PersonAvatar person={m.person} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{m.person.name}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {m.email} · joined {formatDate(m.joinedAt)}
                  </div>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "outline"} className="capitalize">
                  {m.role}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-sm">Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length ? (
            <ul className="divide-y">
              {invitations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{i.email}</div>
                    <div className="text-muted-foreground text-xs">
                      Invited by {i.invitedBy?.name ?? "—"} · expires {formatDate(i.expiresAt)}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {i.role}
                  </Badge>
                  <PendingButton size="xs" variant="ghost" phase={2} feature="Revoking invites">
                    Revoke
                  </PendingButton>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No pending invitations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
