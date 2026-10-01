import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api, requireGuard } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  await requireGuard();
  const gates = await prisma.gate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ gates: gates.map((g) => ({ id: g.id, name: g.name, enabled: g.enabled })) });
});
