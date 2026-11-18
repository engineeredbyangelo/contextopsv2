import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase isn't configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local (`pnpm exec supabase status -o env`).",
    );
  }
  return { url, key };
}

/**
 * Supabase client acting as the signed-in user, so RLS scopes every row. Create one per
 * request. Server Components can't set cookies; the proxy refreshes the session there.
 */
export async function createClient() {
  // cookies() first: it marks the render as request-time, so prerendering stops here.
  const store = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: ignore, the proxy keeps the session fresh.
        }
      },
    },
  });
}
