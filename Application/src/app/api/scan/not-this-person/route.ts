import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireGuard } from "@/lib/rbac";
import { appendLog } from "@/lib/audit";
import { raiseAlert, setGateDisplay } from "@/lib/engine";

const Body = z.object({ movementId: z.string().min(1) });

// Guard says the face does not match the photo: the entry/exit is removed from the
// register, the student's status is restored, and a flagged event + alert are recorded.
export const POST = api(async (req: Request) => {
  const u = await requireGuard();
  const { movementId } = Body.parse(await req.json());
  const m = await prisma.movement.findUnique({ where: { id: movementId } });
  if (!m) throw new ApiError(404, "Record not found");
  if (Date.now() - m.ts.getTime() > 2 * 60_000) throw new ApiError(409, "Too late to cancel this record");

  const prev = await prisma.movement.findFirst({ where: { identityId: m.identityId, id: { not: m.id } }, orderBy: { ts: "desc" } });
  await prisma.movement.delete({ where: { id: m.id } });
  await prisma.identity.update({ where: { id: m.identityId }, data: { presence: prev?.direction ?? null, presenceAt: prev?.ts ?? null } });

  const log = m.logSeq ? await prisma.logEntry.findUnique({ where: { seq: m.logSeq } }) : null;
  await appendLog({ kind: "ACCESS", gateId: m.gateId, pseudonym: log?.pseudonym, decision: "DENY_SUSPICIOUS", reasonCode: "FACE_MISMATCH", guardId: u.id, flagged: true, detail: { cancels: m.logSeq } });
  await raiseAlert(m.gateId, log?.pseudonym ?? null, "FACE_MISMATCH", "Guard reported the face did not match the photo");
  await setGateDisplay(m.gateId, "DENY_SUSPICIOUS");
  return NextResponse.json({ ok: true });
});
