import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, requireAdmin } from "@/lib/rbac";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Security alerts (QR reuse, repeated failures, face mismatch). An open alert keeps
// that student's pass at SUSPICIOUS until an admin reviews and closes it.
export const GET = api(async () => {
  await requireAdmin();
  const alerts = await prisma.alert.findMany({ orderBy: [{ status: "asc" }, { ts: "desc" }], take: 50 });
  const pseudonyms = alerts.map((a) => a.pseudonym).filter(Boolean) as string[];
  const creds = await prisma.credential.findMany({ where: { pseudonym: { in: pseudonyms } }, include: { identity: { select: { fullName: true, rollNo: true } } } });
  const who = Object.fromEntries(creds.map((c) => [c.pseudonym, `${c.identity.fullName}${c.identity.rollNo ? ` (${c.identity.rollNo})` : ""}`]));
  return NextResponse.json({ alerts: alerts.map((a) => ({ ...a, student: a.pseudonym ? (who[a.pseudonym] ?? null) : null })) });
});

const Body = z.object({ id: z.string() });

export const POST = api(async (req: Request) => {
  const u = await requireAdmin();
  const { id } = Body.parse(await req.json());
  await prisma.alert.update({ where: { id }, data: { status: "ACK", ackBy: u.email } });
  await logAdmin(u.id, "ALERT_CLOSED", id);
  return NextResponse.json({ ok: true });
});
