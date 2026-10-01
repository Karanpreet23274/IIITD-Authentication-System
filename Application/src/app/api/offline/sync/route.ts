import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, requireGuard } from "@/lib/rbac";
import { appendLog } from "@/lib/audit";
import { raiseAlert } from "@/lib/engine";

const Event = z.object({
  ts: z.number().int(),
  gateId: z.string(),
  pseudonym: z.string().nullable(),
  direction: z.enum(["IN", "OUT"]).nullable(),
  decision: z.enum(["ALLOW", "DENY_NOT_RECOGNISED", "DENY_BLOCKED", "DENY_SUSPICIOUS"]),
  reasonCode: z.string().max(40),
  nonce: z.string().max(64).optional(),
  sid: z.string().max(64).optional(),
});
const Body = z.object({ events: z.array(Event).max(1000) });

// Scans verified offline are uploaded when the network returns: they become normal
// register entries (marked offline). A QR used twice while offline is flagged.
export const POST = api(async (req: Request) => {
  const u = await requireGuard();
  const { events } = Body.parse(await req.json());
  let conflicts = 0;
  for (const e of events.sort((a, b) => a.ts - b.ts)) {
    let decision = e.decision;
    if (e.nonce) {
      const r = await prisma.usedNonce.createMany({ data: [{ nonce: e.nonce }], skipDuplicates: true });
      if (r.count === 0) {
        conflicts++;
        decision = "DENY_SUSPICIOUS";
        await raiseAlert(e.gateId, e.pseudonym, "OFFLINE_REUSE", "A QR was used more than once while a gate was offline");
      }
    }
    const log = await appendLog({
      kind: "ACCESS",
      gateId: e.gateId,
      pseudonym: e.pseudonym,
      direction: decision === "ALLOW" ? e.direction : null,
      decision,
      reasonCode: decision === e.decision ? e.reasonCode : "OFFLINE_REUSE",
      guardId: u.id,
      flagged: decision !== "ALLOW",
      offline: true,
      detail: { occurredAt: new Date(e.ts).toISOString() },
    });
    if (decision === "ALLOW" && e.pseudonym && e.direction) {
      const cred = await prisma.credential.findUnique({ where: { pseudonym: e.pseudonym } });
      if (cred) {
        const ts = new Date(e.ts);
        if (e.sid) await prisma.passSession.updateMany({ where: { id: e.sid, usedAt: null }, data: { usedAt: ts } });
        await prisma.movement.create({ data: { identityId: cred.identityId, direction: e.direction, gateId: e.gateId, guardEmail: u.email, ts, offline: true, logSeq: log.seq } });
        await prisma.identity.update({ where: { id: cred.identityId }, data: { presence: e.direction, presenceAt: ts } });
      }
    }
  }
  return NextResponse.json({ synced: events.length, conflicts });
});
