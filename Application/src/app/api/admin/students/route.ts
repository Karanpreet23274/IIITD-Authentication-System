import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireAdmin } from "@/lib/rbac";
import { logAdmin } from "@/lib/audit";
import { photoUrl } from "@/lib/photo";
import { CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

// Student lookup + block/unblock (e.g. disciplinary hold, suspected misuse).
export const GET = api(async (req: Request) => {
  const me = await requireAdmin();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const people = await prisma.identity.findMany({
    where: q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { rollNo: { contains: q } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { lastSeenAt: "desc" },
    take: 30,
    include: {
      photo: { select: { id: true } },
      credentials: { orderBy: { createdAt: "desc" }, take: 1, include: { _count: { select: { devices: { where: { revokedAt: null } } } } } },
    },
  });
  // Role per person in one query (guards/admins can't be deleted from here).
  const grants = new Map((await prisma.accessGrant.findMany({ where: { email: { in: people.map((p) => p.email) } } })).map((g) => [g.email, g.role]));
  const roleOf = (email: string) => (CONFIG.ADMIN_EMAILS.includes(email) ? "ADMIN" : (grants.get(email) ?? "STUDENT"));
  return NextResponse.json({
    people: people.map((p) => ({
      appRole: roleOf(p.email),
      isMe: p.id === me.id,
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      rollNo: p.rollNo,
      programme: p.programme,
      batch: p.batch,
      residence: p.residence,
      hostelRoom: p.hostelRoom,
      phone: p.phone,
      presence: p.presence,
      presenceAt: p.presenceAt,
      profileComplete: !!p.profileAt,
      photoUrl: p.photo ? photoUrl(p.id, 300) : null,
      pass: p.credentials[0] ? { status: p.credentials[0].status, reason: p.credentials[0].statusReason, phoneEnrolled: p.credentials[0]._count.devices > 0 } : null,
    })),
  });
});

const Body = z.object({ identityId: z.string(), action: z.enum(["block", "unblock"]), reason: z.string().trim().min(3).max(120) });

export const POST = api(async (req: Request) => {
  const u = await requireAdmin();
  const b = Body.parse(await req.json());
  const cred = await prisma.credential.findFirst({ where: { identityId: b.identityId, status: b.action === "block" ? "ACTIVE" : "BLOCKED" }, orderBy: { createdAt: "desc" } });
  if (!cred) throw new ApiError(409, b.action === "block" ? "No active pass to block" : "Pass is not blocked");
  await prisma.credential.update({ where: { id: cred.id }, data: { status: b.action === "block" ? "BLOCKED" : "ACTIVE", statusReason: b.action === "block" ? b.reason : null } });
  if (b.action === "block") await prisma.passSession.updateMany({ where: { credentialId: cred.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await logAdmin(u.id, b.action === "block" ? "PASS_BLOCKED" : "PASS_UNBLOCKED", cred.pseudonym, { reason: b.reason });
  return NextResponse.json({ ok: true });
});
