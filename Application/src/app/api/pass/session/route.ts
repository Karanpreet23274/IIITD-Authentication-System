import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireUser } from "@/lib/rbac";
import { CONFIG } from "@/lib/config";

const Body = z.object({ deviceId: z.string().min(1) });

// Start a 5-minute live pass (IRCTC-style live ticket). Starting a new one ends any
// previous one, so only one live pass exists per student.
export const POST = api(async (req: Request) => {
  const u = await requireUser();
  const { deviceId } = Body.parse(await req.json());
  const device = await prisma.device.findUnique({ where: { id: deviceId }, include: { credential: { include: { identity: true } } } });
  if (!device || device.revokedAt || device.credential.identityId !== u.id) {
    throw new ApiError(409, "This phone is not enrolled. Enrol this phone to generate a pass.");
  }
  if (device.credential.status === "BLOCKED") throw new ApiError(403, "Your pass is blocked. Please visit the Security Office.");
  if (device.credential.status !== "ACTIVE") throw new ApiError(403, "This phone's pass was disabled. Enrol your phone again.");
  if (!device.credential.identity.profileAt) throw new ApiError(400, "Complete your profile first");

  await prisma.passSession.updateMany({ where: { identityId: u.id, revokedAt: null, usedAt: null }, data: { revokedAt: new Date() } });
  const session = await prisma.passSession.create({
    data: { identityId: u.id, credentialId: device.credentialId, deviceId: device.id, expiresAt: new Date(Date.now() + CONFIG.PASS_SESSION_SECONDS * 1000) },
  });
  return NextResponse.json({ sid: session.id, expiresAt: session.expiresAt, rotateSeconds: CONFIG.QR_ROTATE_SECONDS });
});

export const DELETE = api(async () => {
  const u = await requireUser();
  await prisma.passSession.updateMany({ where: { identityId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
});
