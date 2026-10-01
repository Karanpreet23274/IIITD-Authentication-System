import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireUser } from "@/lib/rbac";
import { appendLog } from "@/lib/audit";
import { newPseudonym } from "@/lib/crypto";

const Body = z.object({
  publicKeyJwk: z.object({ kty: z.literal("EC"), crv: z.literal("P-256"), x: z.string().min(10), y: z.string().min(10) }),
  userAgent: z.string().max(200).optional(),
});

// Bind the pass to this phone. The private key never leaves the phone; the server keeps
// only the public key. Only ONE phone can be bound at a time: enrolling a new phone
// unbinds the old one (logged), so a pass can never be generated on two phones.
export const POST = api(async (req: Request) => {
  const u = await requireUser();
  const body = Body.parse(await req.json());
  const identity = await prisma.identity.findUnique({ where: { id: u.id } });
  if (!identity) throw new ApiError(404, "Not found");
  if (!identity.profileAt) throw new ApiError(400, "Complete your profile first");

  const creds = await prisma.credential.findMany({ where: { identityId: u.id }, orderBy: { createdAt: "desc" } });
  if (creds.some((c) => c.status === "BLOCKED")) throw new ApiError(403, "Your pass is blocked. Please visit the Security Office.");
  let cred = creds.find((c) => c.status === "ACTIVE") ?? null;
  if (!cred) {
    cred = await prisma.credential.create({ data: { identityId: u.id, pseudonym: newPseudonym() } });
    await appendLog({ kind: "ADMIN", actorId: u.id, action: "PASS_CREDENTIAL_CREATED", target: cred.pseudonym });
  }

  const now = new Date();
  const old = await prisma.device.updateMany({ where: { credentialId: cred.id, revokedAt: null }, data: { revokedAt: now } });
  await prisma.passSession.updateMany({ where: { identityId: u.id, revokedAt: null }, data: { revokedAt: now } });
  const device = await prisma.device.create({ data: { credentialId: cred.id, publicKeyJwk: body.publicKeyJwk, userAgent: body.userAgent?.slice(0, 200) } });
  await appendLog({ kind: "ADMIN", actorId: u.id, action: "PHONE_ENROLLED", target: cred.pseudonym, detail: { replacedPhones: old.count } });
  return NextResponse.json({ deviceId: device.id, replacedPhones: old.count });
});
