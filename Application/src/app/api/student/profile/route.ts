import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { api, ApiError, requireUser } from "@/lib/rbac";
import { logAdmin } from "@/lib/audit";
import { rollFromEmail } from "@/lib/auth";

const Body = z
  .object({
    rollNo: z.string().trim().regex(/^\d{7}$/, "Roll no. must be 7 digits, e.g. 2021001").optional(),
    programme: z.string().trim().min(2, "Select your programme").max(60),
    batch: z.string().trim().regex(/^20\d{2}$/, "Batch must be a year, e.g. 2021"),
    residence: z.enum(["HOSTELLER", "DAY_SCHOLAR"]),
    hostelRoom: z.string().trim().max(40).optional(),
    phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  })
  .refine((b) => b.residence !== "HOSTELLER" || !!b.hostelRoom, { message: "Enter your hostel and room", path: ["hostelRoom"] });

// The student completes their profile once (name, e-mail and photo come from IIITD Google;
// roll no. is taken from the IIITD e-mail when it has one).
export const POST = api(async (req: Request) => {
  const u = await requireUser();
  const b = Body.parse(await req.json());
  const i = await prisma.identity.findUnique({ where: { id: u.id } });
  if (!i) throw new ApiError(404, "Not found");
  const derived = rollFromEmail(i.email);
  const rollNo = derived?.rollNo ?? b.rollNo ?? i.rollNo;
  if (!rollNo) throw new ApiError(400, "Enter your roll number");
  await prisma.identity.update({
    where: { id: u.id },
    data: {
      rollNo,
      programme: b.programme,
      batch: derived?.batch ?? b.batch,
      residence: b.residence,
      hostelRoom: b.residence === "HOSTELLER" ? b.hostelRoom : null,
      phone: b.phone.replace(/[\s-]/g, ""),
      profileAt: i.profileAt ?? new Date(),
    },
  });
  await logAdmin(u.id, i.profileAt ? "PROFILE_UPDATED" : "PROFILE_COMPLETED", u.id);
  return NextResponse.json({ ok: true });
});
