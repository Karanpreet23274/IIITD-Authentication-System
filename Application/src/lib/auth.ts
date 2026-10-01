import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AppRole } from "@prisma/client";
import { prisma } from "./db";
import { CONFIG, DEMO_LOGIN } from "./config";
import { appendLog } from "./audit";

// Single sign-in path: IIITD Google accounts only (verified by Google / IIITD Workspace).
// The app a person gets — Student or Guard (or Admin) — comes from the AccessGrant list.

declare module "next-auth" {
  interface Session {
    user: { id: string; name: string; email: string; role: AppRole };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: AppRole;
    roleAt?: number;
  }
}

export const isIiitdEmail = (email: string) => email.toLowerCase().endsWith(`@${CONFIG.ALLOWED_DOMAIN}`);

/** IIITD student addresses end in batch year + serial, e.g. aarav21001 → roll 2021001, batch 2021. */
export function rollFromEmail(email: string): { rollNo: string; batch: string } | null {
  const m = email.split("@")[0].match(/(\d{2})(\d{3})$/);
  return m ? { rollNo: `20${m[1]}${m[2]}`, batch: `20${m[1]}` } : null;
}

export async function roleFor(email: string): Promise<AppRole> {
  const e = email.toLowerCase();
  if (CONFIG.ADMIN_EMAILS.includes(e)) return "ADMIN";
  const grant = await prisma.accessGrant.findUnique({ where: { email: e } });
  return grant?.role ?? "STUDENT";
}

async function fetchProfilePhoto(url: string | undefined | null) {
  if (!url) return null;
  try {
    const res = await fetch(url.replace(/=s\d+-c$/, "=s400-c"));
    if (!res.ok) return null;
    return { mime: res.headers.get("content-type") || "image/jpeg", data: Buffer.from(await res.arrayBuffer()) };
  } catch {
    return null;
  }
}

/** Create or refresh the person's record from what IIITD Google tells us. */
async function upsertIdentity(email: string, name: string, picture?: string | null) {
  const e = email.toLowerCase();
  const derived = rollFromEmail(e);
  const existing = await prisma.identity.findUnique({ where: { email: e }, include: { photo: { select: { id: true } } } });
  const identity = existing
    ? await prisma.identity.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), ...(name ? { fullName: name, firstName: name.split(" ")[0] } : {}) } })
    : await prisma.identity.create({
        data: {
          email: e,
          fullName: name || e.split("@")[0],
          firstName: (name || e.split("@")[0]).split(" ")[0],
          rollNo: derived?.rollNo,
          batch: derived?.batch,
        },
      });
  // Photo on file comes from the IIITD Google account (refreshed on each sign-in).
  const p = await fetchProfilePhoto(picture);
  if (p) await prisma.photo.upsert({ where: { identityId: identity.id }, create: { identityId: identity.id, ...p }, update: p });
  if (!existing) await appendLog({ kind: "ADMIN", actorId: identity.id, action: "ACCOUNT_CREATED", target: identity.id });
  return identity;
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // `hd` makes Google show only IIITD accounts; the signIn callback enforces it.
      authorization: { params: { hd: CONFIG.ALLOWED_DOMAIN, prompt: "select_account" } },
    }),
  );
}

if (DEMO_LOGIN) {
  // LOCAL DEMO ONLY: impersonate a seeded @iiitd.ac.in account without Google.
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: { email: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!isIiitdEmail(email)) return null;
        const identity = await prisma.identity.findUnique({ where: { email } });
        if (!identity) return null;
        return { id: identity.id, name: identity.fullName, email } as never;
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        const p = profile as { email?: string; email_verified?: boolean; hd?: string } | undefined;
        const email = p?.email?.toLowerCase() ?? "";
        // Must be a verified account that belongs to the IIITD Google Workspace.
        if (!p?.email_verified || !isIiitdEmail(email) || p.hd !== CONFIG.ALLOWED_DOMAIN) return "/login?error=domain";
        return true;
      }
      return !!user?.email && isIiitdEmail(user.email);
    },
    async jwt({ token, account, profile }) {
      if (account && token.email) {
        const pic = account.provider === "google" ? (profile as { picture?: string } | undefined)?.picture : null;
        const identity = await upsertIdentity(token.email, token.name ?? "", pic);
        token.uid = identity.id;
        token.name = identity.fullName;
      }
      // Re-check the role every minute so removing someone from the guard list takes effect quickly.
      if (token.email && (!token.role || !token.roleAt || Date.now() - token.roleAt > 60_000)) {
        token.role = await roleFor(token.email);
        token.roleAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.uid ?? "", name: token.name ?? "", email: token.email ?? "", role: token.role ?? "STUDENT" };
      return session;
    },
  },
};
