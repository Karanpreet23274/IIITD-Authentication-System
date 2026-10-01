"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { ErrorNote } from "@/components/ui";
import { InstallAppCard } from "@/components/Pwa";

const ERRORS: Record<string, string> = {
  domain: "Only IIITD accounts (@iiitd.ac.in) can sign in. Please choose your college account.",
  AccessDenied: "Only IIITD accounts (@iiitd.ac.in) can sign in.",
  OAuthCallback: "Google sign-in failed. Please try again.",
};

export default function LoginForms({
  error,
  googleEnabled,
  domain,
  demoPeople,
}: {
  error?: string;
  googleEnabled: boolean;
  domain: string;
  demoPeople: { email: string; fullName: string; role: string }[];
}) {
  const err = error ? (ERRORS[error] ?? "Sign-in failed. Please try again.") : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-brand">
          <ShieldCheck className="h-7 w-7" />
          <span className="text-lg font-bold">IIITD Gate Entry</span>
        </Link>
        <div className="card space-y-4">
          <div>
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-slate-600">
              Use your IIITD Google account (<b>@{domain}</b>). Students get their gate QR; guards get the scanner.
            </p>
          </div>
          <ErrorNote msg={err} />
          <button className="btn-dark btn-lg w-full" disabled={!googleEnabled} onClick={() => signIn("google", { callbackUrl: "/" })}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Continue with IIITD Google
          </button>
          {!googleEnabled && <p className="text-xs text-amber-700">Google sign-in is not configured on this deployment yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).</p>}

          {demoPeople.length > 0 && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-800">Local demo only: sign in as</div>
              <div className="mt-2 grid gap-1.5">
                {demoPeople.map((p) => (
                  <button key={p.email} className="btn-outline justify-between text-left" onClick={() => signIn("demo", { email: p.email, callbackUrl: "/" })}>
                    <span className="truncate">{p.fullName}</span>
                    <span className="text-xs text-slate-500">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <InstallAppCard compact />
        </div>
      </div>
    </main>
  );
}
