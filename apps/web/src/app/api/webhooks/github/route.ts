import { NextResponse } from "next/server";

/**
 * GitHub App webhooks. Phase 2 verifies X-Hub-Signature-256, dedupes on the delivery id
 * and forwards the event to Inngest. Until then, refuse deliveries explicitly.
 */
export function POST() {
  return NextResponse.json({ error: "GitHub webhooks are not configured yet" }, { status: 501 });
}
