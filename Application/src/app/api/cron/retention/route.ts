import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendLog, writeCheckpoint } from "@/lib/audit";
import { CONFIG } from "@/lib/config";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

const days = (n: number) => new Date(Date.now() - n * 86400_000);

// Nightly clean-up: old register entries and scan logs beyond the retention period,
// used QR nonces and finished passes. The purge itself is logged.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await writeCheckpoint(); // keep the chain verifiable from the new oldest row

  const cutoff = days(CONFIG.RETENTION_DAYS);
  const purgeWhere = { kind: "ACCESS" as const, ts: { lt: cutoff } };
  const maxPurged = await prisma.logEntry.aggregate({ where: purgeWhere, _max: { seq: true } });
  const logs = await prisma.logEntry.deleteMany({ where: purgeWhere });
  const movements = await prisma.movement.deleteMany({ where: { ts: { lt: cutoff } } });
  const nonces = await prisma.usedNonce.deleteMany({ where: { usedAt: { lt: days(1) } } });
  const sessions = await prisma.passSession.deleteMany({ where: { expiresAt: { lt: days(1) } } });

  const summary = { accessLogs: logs.count, maxPurgedSeq: maxPurged._max.seq ?? 0, movements: movements.count, nonces: nonces.count, sessions: sessions.count };
  await appendLog({ kind: "SYSTEM", action: "RETENTION_PURGE", target: "all", detail: summary });
  return NextResponse.json({ ok: true, ...summary });
}
