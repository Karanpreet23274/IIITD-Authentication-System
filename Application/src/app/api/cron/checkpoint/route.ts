import { NextResponse } from "next/server";
import { writeCheckpoint } from "@/lib/audit";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Hourly signed checkpoint of the log hash chain (SEC-10). Triggered by Vercel Cron.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cp = await writeCheckpoint();
  return NextResponse.json({ ok: true, seq: cp?.seq ?? null });
}
