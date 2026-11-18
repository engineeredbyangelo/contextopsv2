import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth return from Supabase Auth (GitHub sign-in). Phase 2 exchanges the code for a
 * session with @supabase/ssr and routes to /onboarding or the last workspace.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=auth_not_configured", request.url));
}
