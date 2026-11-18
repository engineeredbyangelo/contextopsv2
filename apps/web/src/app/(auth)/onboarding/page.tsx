import { Suspense } from "react";
import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { listImportCandidates, listMyWorkspaces, listRepositories } from "@/server/data";

export const metadata = { title: "Get started" };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-2xl" />}>
      <Onboarding />
    </Suspense>
  );
}

async function Onboarding() {
  // Phase 1: the wizard previews against the user's first workspace (Northwind in the demo).
  const [demo] = await listMyWorkspaces();
  const [repos, candidates] = demo
    ? await Promise.all([listRepositories(demo.id), listImportCandidates(demo.id)])
    : [[], []];
  return (
    <OnboardingWizard repos={repos} candidates={candidates} demoWorkspaceSlug={demo?.slug ?? ""} />
  );
}
