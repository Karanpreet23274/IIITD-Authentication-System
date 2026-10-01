import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Public feed for the student-facing gate screen. No personal data at all: only the
// result colour and a short message, cleared after 5 s.
export const GET = api(async (_req: Request, { params }: { params: { id: string } }) => {
  const gate = await prisma.gate.findUnique({ where: { id: params.id } });
  if (!gate) return NextResponse.json({ error: "Unknown gate" }, { status: 404 });
  const fresh = gate.displayAt && Date.now() - gate.displayAt.getTime() < 5000;
  return NextResponse.json({ gate: { id: gate.id, name: gate.name }, lane: gate.enabled ? "ONLINE" : "CLOSED", display: fresh ? gate.display : { state: "IDLE" }, at: gate.displayAt });
});
