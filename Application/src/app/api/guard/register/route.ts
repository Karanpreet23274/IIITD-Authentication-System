import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { api, requireGuard } from "@/lib/rbac";
import { startOfIstDay } from "@/lib/time";
import { photoUrl } from "@/lib/photo";

export const dynamic = "force-dynamic";

const IST = 330 * 60_000;

// The digital gate register (replaces the paper register): who went in/out, when, where.
// ?date=YYYY-MM-DD (IST) &gate= &dir=IN|OUT &q=name/roll &format=csv
export const GET = api(async (req: Request) => {
  await requireGuard();
  const sp = new URL(req.url).searchParams;
  const date = sp.get("date");
  const from = date ? new Date(new Date(`${date}T00:00:00Z`).getTime() - IST) : startOfIstDay();
  const to = new Date(from.getTime() + 86400_000);
  const where: Prisma.MovementWhereInput = { ts: { gte: from, lt: to } };
  if (sp.get("gate")) where.gateId = sp.get("gate")!;
  if (sp.get("dir") === "IN" || sp.get("dir") === "OUT") where.direction = sp.get("dir") as "IN" | "OUT";
  const q = sp.get("q")?.trim();
  if (q) where.identity = { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { rollNo: { contains: q } }, { email: { contains: q, mode: "insensitive" } }] };

  const csv = sp.get("format") === "csv";
  const rows = await prisma.movement.findMany({
    where,
    orderBy: { ts: "desc" },
    take: csv ? 10000 : 300,
    include: { identity: { include: { photo: { select: { id: true } } } } },
  });
  const gates = Object.fromEntries((await prisma.gate.findMany({ select: { id: true, name: true } })).map((g) => [g.id, g.name]));
  const [ins, outs, onCampus] = await Promise.all([
    prisma.movement.count({ where: { ...where, direction: "IN" } }),
    prisma.movement.count({ where: { ...where, direction: "OUT" } }),
    prisma.identity.count({ where: { presence: "IN" } }),
  ]);

  if (csv) {
    const head = ["Time (IST)", "Direction", "Gate", "Name", "Roll no", "Programme", "Batch", "Residence", "Hostel/room", "Phone", "Email", "Guard", "Offline"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((m) =>
      [
        new Date(m.ts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }),
        m.direction === "IN" ? "ENTRY" : "EXIT",
        gates[m.gateId] ?? m.gateId,
        m.identity.fullName,
        m.identity.rollNo,
        m.identity.programme,
        m.identity.batch,
        m.identity.residence,
        m.identity.hostelRoom,
        m.identity.phone,
        m.identity.email,
        m.guardEmail,
        m.offline ? "yes" : "",
      ]
        .map(esc)
        .join(","),
    );
    return new Response([head.join(","), ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="gate-register-${date ?? "today"}.csv"` },
    });
  }

  return NextResponse.json({
    counts: { in: ins, out: outs, onCampus },
    rows: rows.map((m) => ({
      id: m.id,
      ts: m.ts,
      direction: m.direction,
      gate: gates[m.gateId] ?? m.gateId,
      guard: m.guardEmail,
      offline: m.offline,
      student: {
        fullName: m.identity.fullName,
        rollNo: m.identity.rollNo,
        programme: m.identity.programme,
        batch: m.identity.batch,
        residence: m.identity.residence,
        hostelRoom: m.identity.hostelRoom,
        phone: m.identity.phone,
        photoUrl: m.identity.photo ? photoUrl(m.identity.id, 300) : null,
      },
    })),
  });
});
