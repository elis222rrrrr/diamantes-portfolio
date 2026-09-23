import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    // Deliberately no error details in the response — this endpoint is public,
    // hit by uptime monitors, and shouldn't leak internal state.
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
