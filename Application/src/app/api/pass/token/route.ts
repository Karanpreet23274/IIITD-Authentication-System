import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireUser } from "@/lib/rbac";
import { CONFIG } from "@/lib/config";
import { makeStudentToken } from "@/lib/token";
import { liveColour } from "@/lib/photo";

const Body = z.object({ sid: z.string().min(1) });

// Lightweight state poll so the pass screen flips to "Entry recorded" right after the scan.
export const GET = api(async (req: Request) => {
  const u = await requireUser();
  const sid = new URL(req.url).searchParams.get("sid") ?? "";
  const s = await prisma.passSession.findUnique({ where: { id: sid }, select: { identityId: true, usedAt: true, revokedAt: true, expiresAt: true } });
  if (!s || s.identityId !== u.id) throw new ApiError(404, "Pass not found");
  const state = s.usedAt ? "USED" : s.revokedAt ? "ENDED" : s.expiresAt < new Date() ? "EXPIRED" : "LIVE";
  const movement = s.usedAt
    ? await prisma.movement.findFirst({ where: { identityId: u.id, ts: { gte: new Date(s.usedAt.getTime() - 5000) } }, orderBy: { ts: "desc" } })
    : null;
  return NextResponse.json({ state, usedAt: s.usedAt, direction: movement?.direction ?? null, gateId: movement?.gateId ?? null });
});

// Issue the next rotating QR token (valid ~20 s) inside a live session.
// The client co-signs it with its non-extractable device key before display.
export const POST = api(async (req: Request) => {
  const u = await requireUser();
  const { sid } = Body.parse(await req.json());
  const s = await prisma.passSession.findUnique({ where: { id: sid }, include: { credential: true } });
  if (!s || s.identityId !== u.id) throw new ApiError(404, "Pass not found");
  if (s.usedAt) return NextResponse.json({ state: "USED", usedAt: s.usedAt });
  if (s.revokedAt) return NextResponse.json({ state: "ENDED" });
  if (s.expiresAt < new Date()) return NextResponse.json({ state: "EXPIRED" });

  const now = Date.now();
  const remaining = Math.floor((s.expiresAt.getTime() - now) / 1000);
  const ttl = Math.max(1, Math.min(CONFIG.QR_TOKEN_SECONDS, remaining));
  const t = makeStudentToken(s.id, s.credential.pseudonym, ttl, now);
  return NextResponse.json({
    state: "LIVE",
    body: t.body,
    sig: t.sig,
    exp: t.payload.exp,
    serverTime: now,
    expiresAt: s.expiresAt,
    liveColour: liveColour(now),
  });
});
