import Link from "next/link";
import { FileCode2, GitPullRequestArrow, ShieldCheck } from "lucide-react";
import { DiffViewer } from "@/components/app/diff-viewer";
import { Button } from "@/components/ui/button";
import { SAMPLE_SYNC_DIFF } from "@/lib/sample";

const FEATURES = [
  {
    icon: FileCode2,
    title: "One policy, three files",
    text: "Write commands, standards and security rules once. ContextOps renders AGENTS.md, CLAUDE.md and Copilot instructions from it.",
  },
  {
    icon: GitPullRequestArrow,
    title: "Pull requests only",
    text: "Every change lands as a reviewable PR. ContextOps never pushes to a default branch and never merges.",
  },
  {
    icon: ShieldCheck,
    title: "Drift you can see",
    text: "Edits to a managed block are flagged within a minute, with the diff and one-click remediation.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Policy-as-code for your AI coding agents
          </h1>
          <p className="text-muted-foreground max-w-prose text-lg">
            Write one versioned policy, assign it to your GitHub repositories, and ContextOps keeps
            every repo&apos;s agent instructions in sync through pull requests.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/login">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/app">See the demo workspace</Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Free for up to 5 repositories. No source code stored.
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-xs">Rolling out Core Standards v2.3.0</p>
          <DiffViewer diff={SAMPLE_SYNC_DIFF} />
        </div>
      </section>
      <section className="bg-muted/30 border-t">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3 md:px-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="space-y-2">
              <f.icon className="size-5" aria-hidden />
              <h2 className="font-medium">{f.title}</h2>
              <p className="text-muted-foreground text-sm">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
