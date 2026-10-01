import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireGuard } from "@/lib/rbac";
import { decideScan } from "@/lib/engine";

const Body = z.object({
  raw: z.string().min(1).max(2000),
  gateId: z.string().min(1),
  direction: z.enum(["IN", "OUT"]).nullable().optional(), // null = automatic
});

const recent = new Map<string, number[]>();

/** Guard scans a student's live QR → verified decision + digital entry/exit record. */
export const POST = api(async (req: Request) => {
  const u = await requireGuard();
  const { raw, gateId, direction } = Body.parse(await req.json());

  // Scanner rate limit: at most 2 scans per second per gate.
  const now = Date.now();
  const hits = (recent.get(gateId) ?? []).filter((t) => now - t < 1000);
  if (hits.length >= 2) throw new ApiError(429, "Too many scans — wait a moment");
  recent.set(gateId, [...hits, now]);

  const gate = await prisma.gate.findUnique({ where: { id: gateId } });
  if (!gate || !gate.enabled) throw new ApiError(404, "Gate not available");
  await prisma.gate.update({ where: { id: gateId }, data: { lastHeartbeat: new Date() } });

  return NextResponse.json(await decideScan(raw, gateId, { id: u.id, email: u.email }, direction ?? null));
});
