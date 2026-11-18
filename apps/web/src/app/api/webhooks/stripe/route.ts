import { NextResponse } from "next/server";

/** Stripe webhooks. Phase 4 verifies the signature and forwards billing events to Inngest. */
export function POST() {
  return NextResponse.json({ error: "Stripe webhooks are not configured yet" }, { status: 501 });
}
