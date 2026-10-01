/* Seed: gates, a guard list and demo @iiitd.ac.in accounts for local testing.
 * In production, people are created automatically when they first sign in with IIITD Google;
 * only the guard/admin list needs to be set (via ADMIN_EMAILS and the Admin page). */
import { PrismaClient, type AppRole, type Residence } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO = process.argv.includes("--demo") || process.env.SEED_DEMO === "true";

function avatarSvg(initials: string, hue: number) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="hsl(${hue},45%,85%)"/><circle cx="200" cy="155" r="80" fill="hsl(${hue},40%,55%)"/><rect x="80" y="260" width="240" height="180" rx="110" fill="hsl(${hue},40%,55%)"/><text x="200" y="175" font-family="Arial" font-size="64" font-weight="700" text-anchor="middle" fill="#fff">${initials}</text></svg>`,
  );
}

async function main() {
  for (const g of [
    { id: "main", name: "Main Gate" },
    { id: "back", name: "Back Gate" },
  ]) {
    await prisma.gate.upsert({ where: { id: g.id }, create: g, update: {} });
  }
  console.log("Gates ready: main, back");
  if (!DEMO) return;

  type P = { email: string; fullName: string; hue: number; role?: AppRole; profile?: { programme: string; residence: Residence; hostelRoom?: string; phone: string } };
  const people: P[] = [
    { email: "aarav21001@iiitd.ac.in", fullName: "Aarav Sharma", hue: 170, profile: { programme: "B.Tech CSE", residence: "HOSTELLER", hostelRoom: "BH-1, 304", phone: "9810000001" } },
    { email: "meher22045@iiitd.ac.in", fullName: "Meher Kaur", hue: 300, profile: { programme: "B.Tech ECE", residence: "DAY_SCHOLAR", phone: "9810000002" } },
    { email: "rohan23117@iiitd.ac.in", fullName: "Rohan Gupta", hue: 30 },
    { email: "guard.ramesh@iiitd.ac.in", fullName: "Ramesh Kumar", hue: 90, role: "GUARD" },
    { email: "guard.suresh@iiitd.ac.in", fullName: "Suresh Yadav", hue: 220, role: "GUARD" },
    { email: "security.admin@iiitd.ac.in", fullName: "Security Admin", hue: 260, role: "ADMIN" },
  ];
  for (const p of people) {
    const m = p.email.split("@")[0].match(/(\d{2})(\d{3})$/);
    const exists = await prisma.identity.findUnique({ where: { email: p.email } });
    if (!exists) {
      await prisma.identity.create({
        data: {
          email: p.email,
          fullName: p.fullName,
          firstName: p.fullName.split(" ")[0],
          rollNo: m ? `20${m[1]}${m[2]}` : null,
          batch: m ? `20${m[1]}` : null,
          ...(p.profile ? { ...p.profile, profileAt: new Date() } : {}),
          photo: { create: { mime: "image/svg+xml", data: avatarSvg(p.fullName.split(" ").map((x) => x[0]).join(""), p.hue) } },
        },
      });
    }
    if (p.role) await prisma.accessGrant.upsert({ where: { email: p.email }, create: { email: p.email, role: p.role, addedBy: "seed" }, update: {} });
  }
  console.log(`Demo accounts ready (${people.length}). Sign in with DEMO_LOGIN=true locally.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
