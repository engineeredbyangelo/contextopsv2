import { Suspense } from "react";
import { GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { PendingButton } from "@/components/app/pending-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { getInvite } from "@/server/data";

export const metadata = { title: "Accept invite" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full max-w-sm" />}>
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  const { token } = await params;
  const invite = await getInvite(token);
  if (!invite) notFound();
  return (
    <Card className="h-fit w-full max-w-sm gap-6">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">
          <h1>Join {invite.workspaceName}</h1>
        </CardTitle>
        <CardDescription>
          {invite.invitedBy?.name ?? "A workspace admin"} invited {invite.email} as{" "}
          <span className="text-foreground font-medium capitalize">{invite.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PendingButton className="w-full" size="lg" phase={2} feature="Accepting invites">
          <GitBranch /> Continue with GitHub
        </PendingButton>
        <p className="text-muted-foreground text-center text-xs">
          {new Date(invite.expiresAt) < new Date()
            ? `This invite expired ${formatDate(invite.expiresAt)}. Ask for a new one.`
            : `This invite expires ${formatDate(invite.expiresAt)}.`}
        </p>
      </CardContent>
    </Card>
  );
}
