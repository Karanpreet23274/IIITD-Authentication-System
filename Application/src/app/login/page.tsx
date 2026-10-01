import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/rbac";
import { DEMO_LOGIN, CONFIG } from "@/lib/config";
import { prisma } from "@/lib/db";
import { roleFor } from "@/lib/auth";
import LoginForms from "./LoginForms";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const u = await currentUser();
  if (u) redirect(homeFor(u));
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const demoPeople = DEMO_LOGIN
    ? await Promise.all(
        (await prisma.identity.findMany({ select: { email: true, fullName: true }, orderBy: { fullName: "asc" }, take: 12 })).map(async (p) => ({ ...p, role: await roleFor(p.email) })),
      )
    : [];
  return <LoginForms error={searchParams.error} googleEnabled={googleEnabled} domain={CONFIG.ALLOWED_DOMAIN} demoPeople={demoPeople} />;
}
