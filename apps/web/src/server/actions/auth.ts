"use server";

import { redirect } from "next/navigation";
import { northwind } from "@/server/demo/northwind";
import { demoSignInEnabled } from "@/server/auth/demo";
import { createClient } from "@/server/supabase/server";

/** Only same-origin paths, so ?next= can't become an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}

/** Signs in as the seeded Northwind owner. Off unless DEMO_SIGN_IN=true (local, CI, previews). */
export async function signInAsDemo(formData: FormData) {
  if (!demoSignInEnabled()) redirect("/login?error=demo_disabled");
  const supabase = await createClient();
  const { email, password } = northwind.demoUser;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=demo_failed");
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
