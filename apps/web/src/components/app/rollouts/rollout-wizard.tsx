"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { TARGETS, TARGET_IDS, isTargetId } from "@contextops/policy-schema";
import { PendingButton } from "@/components/app/pending-button";
import { RepoStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPO_STATUS, REPO_STATUS_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { PolicyVersionOption, RepoListItem, RepoStatus } from "@/server/data/types";

const STEPS = ["Version", "Repositories", "Targets", "Review"] as const;
const ALL = "all";

type Plan = "changing" | "unchanged" | "blocked";

export function RolloutWizard({
  options,
  repos,
  initialPolicyId,
}: {
  options: PolicyVersionOption[];
  repos: RepoListItem[];
  initialPolicyId: string | null;
}) {
  const initial = options.find((o) => o.policy.id === initialPolicyId) ?? options[0];
  const [step, setStep] = useState(0);
  const [policyId, setPolicyId] = useState(initial?.policy.id ?? "");
  const option = options.find((o) => o.policy.id === policyId);
  const [versionId, setVersionId] = useState(initial?.versions[0]?.id ?? "");
  const version = option?.versions.find((v) => v.id === versionId);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(repos.filter((r) => r.policy?.id === initial?.policy.id).map((r) => r.id)),
  );
  const [targets, setTargets] = useState<Set<string>>(
    () => new Set(initial?.targets ?? TARGET_IDS),
  );
  const [org, setOrg] = useState(ALL);
  const [language, setLanguage] = useState(ALL);
  const [status, setStatus] = useState<RepoStatus | typeof ALL>(ALL);
  const [query, setQuery] = useState("");

  const orgs = useMemo(() => [...new Set(repos.map((r) => r.owner))].sort(), [repos]);
  const languages = useMemo(
    () => [...new Set(repos.map((r) => r.language).filter(Boolean) as string[])].sort(),
    [repos],
  );
  const visible = repos.filter(
    (r) =>
      (org === ALL || r.owner === org) &&
      (language === ALL || r.language === language) &&
      (status === ALL || r.status === status) &&
      (!query || r.fullName.toLowerCase().includes(query.toLowerCase())),
  );

  const planFor = (r: RepoListItem): Plan => {
    if (r.status === "disconnected" || r.status === "exempted") return "blocked";
    if (
      r.policy?.id === policyId &&
      r.appliedVersion === version?.semver &&
      r.status === "compliant"
    )
      return "unchanged";
    return "changing";
  };
  const chosen = repos.filter((r) => selected.has(r.id));
  const summary = { changing: 0, unchanged: 0, blocked: 0 };
  for (const r of chosen) summary[planFor(r)]++;

  const choosePolicy = (id: string) => {
    const o = options.find((x) => x.policy.id === id);
    setPolicyId(id);
    setVersionId(o?.versions[0]?.id ?? "");
    setTargets(new Set(o?.targets ?? TARGET_IDS));
    setSelected(new Set(repos.filter((r) => r.policy?.id === id).map((r) => r.id)));
  };
  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const canContinue = [!!version, selected.size > 0, targets.size > 0, true][step];

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-2.5 py-1",
                i === step
                  ? "border-foreground/30 bg-accent font-medium"
                  : "text-muted-foreground disabled:opacity-50",
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full border text-[10px]">
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <Card className="max-w-xl gap-4">
          <CardHeader>
            <CardTitle className="text-sm">Choose a policy version</CardTitle>
            <CardDescription>Only published versions can be rolled out.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="policy">Policy</Label>
              <Select value={policyId} onValueChange={choosePolicy}>
                <SelectTrigger id="policy" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.policy.id} value={o.policy.id}>
                      {o.policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Select value={versionId} onValueChange={setVersionId}>
                <SelectTrigger id="version" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {option?.versions.map((v, i) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.semver}
                      {i === 0 ? " (latest)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect
              label="Org"
              value={org}
              onChange={setOrg}
              items={orgs.map((o) => [o, o])}
            />
            <FilterSelect
              label="Language"
              value={language}
              onChange={setLanguage}
              items={languages.map((l) => [l, l])}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as RepoStatus | typeof ALL)}
              items={REPO_STATUS_ORDER.map((s) => [s, REPO_STATUS[s].label])}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name"
              aria-label="Filter by name"
              className="h-9 w-full sm:w-56"
            />
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(new Set([...selected, ...visible.map((r) => r.id)]))}
              >
                Select shown
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{selected.size} selected</p>
          <ul className="divide-y rounded-lg border">
            {visible.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer flex-wrap items-center gap-3 px-3 py-2 text-sm">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => setSelected((s) => toggle(s, r.id))}
                    aria-label={`Include ${r.fullName}`}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.fullName}</span>
                  <span className="text-muted-foreground hidden sm:inline">{r.language}</span>
                  <RepoStatusBadge status={r.status} />
                </label>
              </li>
            ))}
            {!visible.length ? (
              <li className="text-muted-foreground p-6 text-center text-sm">
                No repositories match these filters.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="max-w-xl gap-4">
          <CardHeader>
            <CardTitle className="text-sm">Choose target files</CardTitle>
            <CardDescription>
              ContextOps only owns the managed block in each file. Content outside it is preserved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TARGET_IDS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={targets.has(t)}
                  onCheckedChange={() => setTargets((s) => toggle(s, t))}
                />
                <span className="font-medium">{TARGETS[t].label}</span>
                <code className="text-muted-foreground font-mono text-xs">{TARGETS[t].path}</code>
              </label>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Will open or update a PR" value={summary.changing} />
            <Stat label="Already up to date" value={summary.unchanged} />
            <Stat label="Blocked (exempt or disconnected)" value={summary.blocked} />
          </div>
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">
                {option?.policy.name} v{version?.semver} → {chosen.length} repos
              </CardTitle>
              <CardDescription>
                {[...targets].map((t) => (isTargetId(t) ? TARGETS[t].path : t)).join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {chosen.map((r) => {
                  const plan = planFor(r);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1 truncate">{r.fullName}</span>
                      <span
                        className={cn(
                          "text-xs",
                          plan === "blocked" ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        {plan === "changing"
                          ? "Opens PR"
                          : plan === "unchanged"
                            ? "No changes"
                            : "Blocked"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex gap-2">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <PendingButton phase={3} feature="Starting rollouts">
            Open {summary.changing} pull request{summary.changing === 1 ? "" : "s"}
          </PendingButton>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-40" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {items.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
