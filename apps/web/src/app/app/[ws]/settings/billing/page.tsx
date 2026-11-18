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
import { Progress } from "@/components/ui/progress";
import { PLANS, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { getBilling } from "@/server/data";
import { requireWorkspace } from "@/server/workspace";

export const metadata = { title: "Billing" };

export default async function BillingPage({ params }: PageProps<"/app/[ws]/settings/billing">) {
  const { ws } = await params;
  const workspace = await requireWorkspace(ws);
  const billing = await getBilling(workspace.id);
  const plan = PLANS[billing.plan];
  const usage = [
    { label: "Connected repositories", used: billing.usage.repos, limit: plan.repos },
    { label: "GitHub organizations", used: billing.usage.orgs, limit: plan.orgs },
  ];
  return (
    <div className="space-y-4">
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            {plan.name} plan <Badge variant="outline">{plan.price}</Badge>
          </CardTitle>
          <CardDescription>
            Priced by connected repositories. Seats, including client viewers, are free.
          </CardDescription>
          <CardAction>
            <PendingButton size="sm" variant="outline" phase={4} feature="The billing portal">
              Manage billing
            </PendingButton>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage.map((u) => (
            <div key={u.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{u.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {u.used} / {u.limit ?? "Unlimited"}
                </span>
              </div>
              <Progress value={u.limit ? (u.used / u.limit) * 100 : 4} aria-label={u.label} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PLANS) as Plan[]).map((key) => {
          const p = PLANS[key];
          const current = key === billing.plan;
          return (
            <Card key={key} className={cn("gap-3", current && "border-foreground/40")}>
              <CardHeader>
                <CardTitle className="text-sm">{p.name}</CardTitle>
                <CardDescription>{p.price}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  {p.repos ?? "Custom"} repos · {p.orgs ?? "Unlimited"} orgs
                </p>
                <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                {current ? (
                  <Badge>Current plan</Badge>
                ) : (
                  <PendingButton size="xs" variant="outline" phase={4} feature="Changing plans">
                    {key === "enterprise" ? "Contact us" : "Switch"}
                  </PendingButton>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
