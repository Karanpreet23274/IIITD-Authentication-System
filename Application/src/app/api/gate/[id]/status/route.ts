import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api, requireGuard } from "@/lib/rbac";
import { startOfIstDay } from "@/lib/time";

export const dynamic = "force-dynamic";

// Guard dashboard data: today's counts at this gate + open alerts.
export const GET = api(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireGuard();
  const gate = await prisma.gate.findUnique({ where: { id: params.id } });
  if (!gate) return NextResponse.json({ error: "Unknown gate" }, { status: 404 });
  const since = startOfIstDay();
  const [ins, outs, denied, alerts] = await Promise.all([
    prisma.movement.count({ where: { gateId: gate.id, direction: "IN", ts: { gte: since } } }),
    prisma.movement.count({ where: { gateId: gate.id, direction: "OUT", ts: { gte: since } } }),
    prisma.logEntry.count({ where: { kind: "ACCESS", gateId: gate.id, decision: { not: "ALLOW" }, ts: { gte: since } } }),
    prisma.alert.findMany({ where: { status: "OPEN", OR: [{ gateId: gate.id }, { gateId: null }] }, orderBy: { ts: "desc" }, take: 5 }),
  ]);
  return NextResponse.json({
    gate: { id: gate.id, name: gate.name, enabled: gate.enabled },
    counts: { in: ins, out: outs, denied },
    alerts: alerts.map((a) => ({ id: a.id, ts: a.ts, kind: a.kind, message: a.message })),
    serverTime: new Date(),
  });
});
