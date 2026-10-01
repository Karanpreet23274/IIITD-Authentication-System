import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireAdmin } from "@/lib/rbac";
import { logAdmin } from "@/lib/audit";
import { CONFIG } from "@/lib/config";
import { isIiitdEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Guard list: IIITD e-mails that open the Guard app instead of the Student app.
export const GET = api(async () => {
  await requireAdmin();
  const grants = await prisma.accessGrant.findMany({ orderBy: [{ role: "asc" }, { email: "asc" }] });
  return NextResponse.json({ grants, bootstrapAdmins: CONFIG.ADMIN_EMAILS });
});

const Body = z.object({ email: z.string().trim().toLowerCase().email(), role: z.enum(["GUARD", "ADMIN"]) });

export const POST = api(async (req: Request) => {
  const u = await requireAdmin();
  const b = Body.parse(await req.json());
  if (!isIiitdEmail(b.email)) throw new ApiError(400, `Only @${CONFIG.ALLOWED_DOMAIN} accounts can be added`);
  await prisma.accessGrant.upsert({ where: { email: b.email }, create: { email: b.email, role: b.role, addedBy: u.email }, update: { role: b.role, addedBy: u.email } });
  await logAdmin(u.id, `ACCESS_GRANTED_${b.role}`, b.email);
  return NextResponse.json({ ok: true });
});

export const DELETE = api(async (req: Request) => {
  const u = await requireAdmin();
  const email = (new URL(req.url).searchParams.get("email") ?? "").toLowerCase();
  if (email === u.email.toLowerCase()) throw new ApiError(400, "You cannot remove yourself");
  await prisma.accessGrant.delete({ where: { email } }).catch(() => {
    throw new ApiError(404, "Not on the list");
  });
  await logAdmin(u.id, "ACCESS_REMOVED", email);
  return NextResponse.json({ ok: true });
});
