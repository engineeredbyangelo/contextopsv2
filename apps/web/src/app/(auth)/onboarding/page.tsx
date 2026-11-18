import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { listImportCandidates, listMyWorkspaces, listRepositories } from "@/server/data";

export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  // Phase 1: the wizard previews against the demo workspace's repos.
  const [demo] = await listMyWorkspaces();
  const [repos, candidates] = demo
    ? await Promise.all([listRepositories(demo.id), listImportCandidates(demo.id)])
    : [[], []];
  return (
    <OnboardingWizard repos={repos} candidates={candidates} demoWorkspaceSlug={demo?.slug ?? ""} />
  );
}
