import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api, requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// The student's own entry/exit records.
export const GET = api(async () => {
  const u = await requireUser();
  const gates = Object.fromEntries((await prisma.gate.findMany({ select: { id: true, name: true } })).map((g) => [g.id, g.name]));
  const rows = await prisma.movement.findMany({ where: { identityId: u.id }, orderBy: { ts: "desc" }, take: 200 });
  return NextResponse.json({ movements: rows.map((m) => ({ id: m.id, ts: m.ts, direction: m.direction, gate: gates[m.gateId] ?? m.gateId, offline: m.offline })) });
});
