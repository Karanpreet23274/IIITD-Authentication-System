import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "./auth";

// Role checks enforced on every API route, not only in the UI.

export type SessionUser = Session["user"];

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function currentUser(): Promise<SessionUser | null> {
  const s = await getServerSession(authOptions);
  return s?.user?.id ? s.user : null;
}

/** Any signed-in IIITD account (students use the pass; guards/admins may too). */
export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw new ApiError(401, "Sign in with your IIITD account");
  return u;
}

export async function requireGuard(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "GUARD" && u.role !== "ADMIN") throw new ApiError(403, "Guard access only");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new ApiError(403, "Admin access only");
  return u;
}

/** Wrap a route handler: converts ApiError / ZodError into JSON; never leaks internals. */
export function api<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      console.error("API error", (e as Error)?.message);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

// ---- Page guards (server components) ----

export async function pageUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function pageGuard() {
  const u = await pageUser();
  if (u.role !== "GUARD" && u.role !== "ADMIN") redirect("/forbidden");
  return u;
}

export async function pageAdmin() {
  const u = await pageUser();
  if (u.role !== "ADMIN") redirect("/forbidden");
  return u;
}

export function homeFor(u: SessionUser): string {
  if (u.role === "GUARD") return "/guard";
  if (u.role === "ADMIN") return "/admin";
  return "/student";
}
