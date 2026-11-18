"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, FilePlus2, FileUp, GitBranch, LayoutTemplate } from "lucide-react";
import { PendingButton } from "@/components/app/pending-button";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { slugify } from "@/lib/schemas";
import { POLICY_TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { ImportCandidate, RepoListItem } from "@/server/data/types";

const STEPS = [
  "Name your workspace",
  "Connect GitHub",
  "Start your policy",
  "Pick repos",
  "Preview and open PRs",
];

/** The five-step sign-up flow from the spec. Every step can be skipped and resumed later. */
export function OnboardingWizard({
  repos,
  candidates,
  demoWorkspaceSlug,
}: {
  repos: RepoListItem[];
  candidates: ImportCandidate[];
  demoWorkspaceSlug: string;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("company");
  const [connected, setConnected] = useState(false);
  const [start, setStart] = useState<"import" | "template" | "blank">(
    candidates.length ? "import" : "template",
  );
  const [picked, setPicked] = useState<Set<string>>(
    () =>
      new Set(
        repos
          .filter((r) => r.status === "unassigned" || r.status === "pending_sync")
          .map((r) => r.id),
      ),
  );
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const orgs = [...new Set(repos.map((r) => r.owner))];

  return (
    <div className="w-full max-w-2xl space-y-6">
      <ol
        className="flex gap-1.5"
        aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
      >
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-foreground" : "bg-muted")}
          />
        ))}
      </ol>

      <Card className="gap-6">
        <CardHeader>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
          <CardTitle className="text-lg">
            <h1>{STEPS[step]}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Engineering"
                />
                {name ? (
                  <p className="text-muted-foreground text-xs">
                    contextops.dev/app/{slugify(name)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Who is this for?</Label>
                <RadioGroup
                  value={audience}
                  onValueChange={setAudience}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {[
                    ["company", "My company", "One team, one or more GitHub orgs."],
                    [
                      "clients",
                      "Clients I manage",
                      "Several client orgs. Turns on multi-org hints.",
                    ],
                  ].map(([v, title, desc]) => (
                    <Label
                      key={v}
                      htmlFor={`aud-${v}`}
                      className="has-data-[state=checked]:border-foreground/40 has-data-[state=checked]:bg-accent flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal"
                    >
                      <RadioGroupItem id={`aud-${v}`} value={v!} className="mt-0.5" />
                      <span>
                        <span className="block font-medium">{title}</span>
                        <span className="text-muted-foreground">{desc}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            connected ? (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm">
                  <Check className="text-success size-4" /> Connected {orgs.join(" and ")} (demo
                  data)
                </p>
                <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border text-sm">
                  {repos.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate">{r.fullName}</span>
                      <span className="text-muted-foreground text-xs">{r.language}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  An org admin installs the ContextOps GitHub App and chooses all or selected
                  repositories. If you aren&apos;t an admin, GitHub asks one for you.
                </p>
                <div className="flex flex-wrap gap-2">
                  <PendingButton phase={2} feature="Installing the GitHub App">
                    <GitBranch /> Install on GitHub
                  </PendingButton>
                  <Button variant="outline" onClick={() => setConnected(true)}>
                    Use demo orgs
                  </Button>
                </div>
              </div>
            )
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  v: "import" as const,
                  icon: FileUp,
                  title: "Import from a repo",
                  desc: candidates.length
                    ? `We found ${candidates.length} existing agent file${candidates.length === 1 ? "" : "s"}.`
                    : "No agent files found.",
                  disabled: !candidates.length,
                },
                {
                  v: "template" as const,
                  icon: LayoutTemplate,
                  title: "Start from a template",
                  desc: POLICY_TEMPLATES.map((t) => t.name).join(", "),
                },
                {
                  v: "blank" as const,
                  icon: FilePlus2,
                  title: "Blank",
                  desc: "Write every section yourself.",
                },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={start === o.v}
                  disabled={o.disabled}
                  onClick={() => setStart(o.v)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm disabled:opacity-50",
                    start === o.v ? "border-foreground/40 bg-accent" : "hover:bg-muted/50",
                  )}
                >
                  <o.icon className="size-5" aria-hidden />
                  <span className="font-medium">{o.title}</span>
                  <span className="text-muted-foreground">{o.desc}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                We preselected repos without agent files. {picked.size} selected.
              </p>
              <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border text-sm">
                {repos.map((r) => (
                  <li key={r.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                      <Checkbox
                        checked={picked.has(r.id)}
                        onCheckedChange={(v) =>
                          setPicked((s) => {
                            const n = new Set(s);
                            if (v) n.add(r.id);
                            else n.delete(r.id);
                            return n;
                          })
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{r.fullName}</span>
                      <RepoStatusBadge status={r.status} />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3 text-sm">
              <p>
                ContextOps will open one pull request per repository adding the managed block to
                AGENTS.md, CLAUDE.md and .github/copilot-instructions.md. Existing content is kept
                below a <em>Repository notes</em> heading.
              </p>
              <p className="text-muted-foreground">
                {picked.size} repositories · nothing merges without your review.
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={step === 0 && !name.trim()}>
              Continue
            </Button>
          ) : (
            <PendingButton phase={2} feature="Opening sync pull requests">
              Open {picked.size} pull requests
            </PendingButton>
          )}
          {step > 0 && step < STEPS.length - 1 ? (
            <Button variant="ghost" onClick={next}>
              Skip for now
            </Button>
          ) : null}
          <Button asChild variant="link" className="ml-auto px-0">
            <Link href={`/app/${demoWorkspaceSlug}`}>Go to the demo workspace</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
