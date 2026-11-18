import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pricing" };

const FAQ = [
  [
    "Why price by repository, not seat?",
    "Repos are where ContextOps creates value, and agencies need to add client engineers as viewers without paying per head.",
  ],
  [
    "Does ContextOps read my source code?",
    "No. It reads and writes only the agent files it manages, plus repository metadata.",
  ],
  [
    "Can ContextOps push to main?",
    "Never. Every change is a pull request, so your branch protection and code review stay the final gate.",
  ],
  ["Is there annual billing?", "Yes. Pay annually and get two months free."],
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 md:px-6">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Priced by connected repositories
        </h1>
        <p className="text-muted-foreground">Seats are free on every plan.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLANS) as Plan[]).map((key) => {
          const p = PLANS[key];
          return (
            <Card key={key} className={cn("gap-4", key === "team" && "border-foreground/40")}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription className="text-foreground text-2xl font-semibold">
                  {p.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 text-sm">
                <p>
                  {p.repos ? `${p.repos} repositories` : "Custom repositories"} ·{" "}
                  {p.orgs ? `${p.orgs} GitHub org${p.orgs > 1 ? "s" : ""}` : "Unlimited orgs"}
                </p>
                <ul className="flex-1 space-y-2">
                  {p.includes.map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={key === "team" ? "default" : "outline"}>
                  <Link href="/login">{key === "enterprise" ? "Contact us" : "Get started"}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <section className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-xl font-semibold">Questions</h2>
        <dl className="space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-medium">{q}</dt>
              <dd className="text-muted-foreground mt-1 text-sm">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
