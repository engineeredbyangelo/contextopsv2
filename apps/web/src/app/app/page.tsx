import { redirect } from "next/navigation";
import { listMyWorkspaces } from "@/server/data";

/** /app → the last-used workspace (phase 2 reads it from a cookie), else onboarding. */
export default async function AppIndex() {
  const [first] = await listMyWorkspaces();
  redirect(first ? `/app/${first.slug}` : "/onboarding");
}
