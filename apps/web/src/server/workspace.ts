import "server-only";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/server/data";

/** Resolves the workspace for a route's [ws] slug, or renders the 404 page. */
export async function requireWorkspace(slug: string) {
  const ws = await getWorkspace(slug);
  if (!ws) notFound();
  return ws;
}
