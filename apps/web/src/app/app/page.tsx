import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { listMyWorkspaces } from "@/server/data";

/** /app → the last-used workspace (phase 2 reads it from a cookie), else onboarding. */
export default function AppIndex() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RedirectToWorkspace />
    </Suspense>
  );
}

async function RedirectToWorkspace(): Promise<never> {
  const [first] = await listMyWorkspaces();
  redirect(first ? `/app/${first.slug}` : "/onboarding");
}
