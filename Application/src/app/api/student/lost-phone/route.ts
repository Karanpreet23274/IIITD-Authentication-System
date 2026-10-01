import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, requireUser } from "@/lib/rbac";
import { appendLog } from "@/lib/audit";

const Body = z.object({ confirm: z.literal("DISABLE") });

// Lost or stolen phone: immediately and permanently disables the pass bound to it.
// Signing in on a new phone and enrolling it creates a fresh pass; the old phone can
// no longer generate passes, and any QR it already showed is rejected.
export const POST = api(async (req: Request) => {
  const u = await requireUser();
  Body.parse(await req.json());
  const now = new Date();
  const creds = await prisma.credential.findMany({ where: { identityId: u.id, status: "ACTIVE" } });
  for (const c of creds) {
    await prisma.credential.update({ where: { id: c.id }, data: { status: "REVOKED", statusReason: "Phone reported lost by student", revokedAt: now } });
    await prisma.passSession.updateMany({ where: { credentialId: c.id, revokedAt: null }, data: { revokedAt: now } });
    await appendLog({ kind: "ADMIN", actorId: u.id, action: "PHONE_REPORTED_LOST", target: c.pseudonym });
  }
  return NextResponse.json({ ok: true, disabled: creds.length });
});
