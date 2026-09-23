import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runJobWorker } from "@/lib/jobs/worker";

/** Constant-time comparison — a plain `!==` leaks how many leading bytes of
 * the secret matched via response timing, the same reasoning the login
 * action already applies to password checks. */
function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

/**
 * Optional manual trigger — not the primary mechanism on this (self-hosted)
 * deployment, where instrumentation.ts's in-process interval already sweeps
 * the queue. Useful for ops visibility or wiring into an external scheduler
 * later. Protected by a shared secret since it's a public route.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";

  if (!secret || !safeCompare(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runJobWorker(50);
  return NextResponse.json({ ok: true });
}
