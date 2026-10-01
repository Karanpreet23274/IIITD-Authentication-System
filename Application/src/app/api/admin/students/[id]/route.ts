import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAdmin } from "@/lib/audit";
import { api, ApiError, requireAdmin } from "@/lib/rbac";
import { photoUrl } from "@/lib/photo";
import { roleFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

// One student's full profile for the admin: details, pass/phone status, every
// entry/exit, rejected scan attempts and open alerts.
export const GET = api(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const p = await prisma.identity.findUnique({
    where: { id: params.id },
    include: {
      photo: { select: { id: true } },
      credentials: { orderBy: { createdAt: "desc" }, include: { devices: { orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!p) throw new ApiError(404, "Student not found");

  const pseudonyms = p.credentials.map((c) => c.pseudonym);
  const gates = Object.fromEntries((await prisma.gate.findMany({ select: { id: true, name: true } })).map((g) => [g.id, g.name]));
  const [movements, entries, exits, rejected, alerts, role] = await Promise.all([
    prisma.movement.findMany({ where: { identityId: p.id }, orderBy: { ts: "desc" }, take: 500 }),
    prisma.movement.count({ where: { identityId: p.id, direction: "IN" } }),
    prisma.movement.count({ where: { identityId: p.id, direction: "OUT" } }),
    pseudonyms.length
      ? prisma.logEntry.findMany({ where: { kind: "ACCESS", pseudonym: { in: pseudonyms }, decision: { not: "ALLOW" } }, orderBy: { seq: "desc" }, take: 50 })
      : [],
    pseudonyms.length ? prisma.alert.findMany({ where: { pseudonym: { in: pseudonyms } }, orderBy: { ts: "desc" }, take: 20 }) : [],
    roleFor(p.email),
  ]);

  const current = p.credentials.find((c) => c.status !== "REVOKED") ?? p.credentials[0] ?? null;
  const phone = current?.devices.find((d) => !d.revokedAt) ?? null;

  return NextResponse.json({
    student: {
      id: p.id,
      fullName: p.fullName,
      email: p.email,
      rollNo: p.rollNo,
      programme: p.programme,
      batch: p.batch,
      residence: p.residence,
      hostelRoom: p.hostelRoom,
      phone: p.phone,
      profileAt: p.profileAt,
      createdAt: p.createdAt,
      lastSeenAt: p.lastSeenAt,
      presence: p.presence,
      presenceAt: p.presenceAt,
      photoUrl: p.photo ? photoUrl(p.id, 600) : null,
      appRole: role,
    },
    pass: current
      ? {
          status: current.status,
          reason: current.statusReason,
          createdAt: current.createdAt,
          phone: phone ? { enrolledAt: phone.createdAt, device: summariseDevice(phone.userAgent) } : null,
          phonesReplaced: p.credentials.reduce((n, c) => n + c.devices.filter((d) => d.revokedAt).length, 0),
          lostReports: p.credentials.filter((c) => c.status === "REVOKED").length,
        }
      : null,
    stats: { entries, exits, total: entries + exits },
    movements: movements.map((m) => ({ id: m.id, ts: m.ts, direction: m.direction, gate: gates[m.gateId] ?? m.gateId, guard: m.guardEmail, offline: m.offline })),
    rejected: rejected.map((r) => ({ seq: r.seq, ts: r.ts, gate: gates[r.gateId ?? ""] ?? r.gateId, decision: r.decision, reason: r.reasonCode })),
    alerts: alerts.map((a) => ({ id: a.id, ts: a.ts, kind: a.kind, message: a.message, status: a.status })),
  });
});

const DeleteBody = z.object({ confirm: z.literal("DELETE"), reason: z.string().trim().min(3, "Enter a reason").max(120) });

// Permanently delete a student account (right to erasure). Cascades to photo, phone keys,
// passes and register movements. The hash-chained scan log is NOT touched: it only holds
// pseudonyms, and once the credential row is gone those can't be linked back to the person.
export const DELETE = api(async (req: Request, { params }: { params: { id: string } }) => {
  const u = await requireAdmin();
  const { reason } = DeleteBody.parse(await req.json());
  if (params.id === u.id) throw new ApiError(400, "You can't delete your own account");
  const p = await prisma.identity.findUnique({ where: { id: params.id }, include: { credentials: { select: { pseudonym: true } } } });
  if (!p) throw new ApiError(404, "Student not found");
  if ((await roleFor(p.email)) !== "STUDENT") throw new ApiError(409, "This person is a guard or admin. Remove them from Guards & admins first.");

  const pseudonyms = p.credentials.map((c) => c.pseudonym);
  const movements = await prisma.movement.count({ where: { identityId: p.id } });
  await prisma.$transaction([
    prisma.alert.deleteMany({ where: { pseudonym: { in: pseudonyms } } }),
    prisma.identity.delete({ where: { id: p.id } }), // cascades: photo, credentials → devices, pass sessions, movements
  ]);
  // No name, e-mail or roll no. in the log entry — only counts and the reason.
  await logAdmin(u.id, "STUDENT_DELETED", p.id, { reason, credentials: pseudonyms.length, movements });
  return NextResponse.json({ ok: true, deleted: { movements, credentials: pseudonyms.length } });
});

/** "Android · Chrome" style label from a user-agent string (no fingerprinting detail). */
function summariseDevice(ua: string | null): string {
  if (!ua) return "Unknown device";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iPhone/iPad" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Other";
  const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${os} · ${br}`;
}
