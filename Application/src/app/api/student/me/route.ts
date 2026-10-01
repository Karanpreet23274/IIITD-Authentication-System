import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api, requireUser } from "@/lib/rbac";
import { photoUrl } from "@/lib/photo";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const u = await requireUser();
  const i = await prisma.identity.findUnique({
    where: { id: u.id },
    include: {
      photo: { select: { id: true } },
      credentials: { orderBy: { createdAt: "desc" }, include: { devices: { where: { revokedAt: null }, select: { id: true, userAgent: true, createdAt: true } } } },
    },
  });
  if (!i) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const activeSession = await prisma.passSession.findFirst({
    where: { identityId: u.id, revokedAt: null, usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true, deviceId: true },
  });
  return NextResponse.json({
    identity: {
      fullName: i.fullName,
      firstName: i.firstName,
      email: i.email,
      rollNo: i.rollNo,
      programme: i.programme,
      batch: i.batch,
      residence: i.residence,
      hostelRoom: i.hostelRoom,
      phone: i.phone,
      profileAt: i.profileAt,
      presence: i.presence,
      presenceAt: i.presenceAt,
      photoUrl: i.photo ? photoUrl(i.id, 600) : null,
    },
    credentials: i.credentials.map((c) => ({ id: c.id, status: c.status, statusReason: c.statusReason, devices: c.devices, createdAt: c.createdAt })),
    activeSession,
  });
});
