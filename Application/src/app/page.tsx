import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, ShieldCheck, ScanLine, ClipboardList } from "lucide-react";
import { currentUser, homeFor } from "@/lib/rbac";

export default async function Home() {
  const u = await currentUser();
  if (u) redirect(homeFor(u));

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="flex items-center gap-2 text-brand">
          <ShieldCheck className="h-8 w-8" />
          <span className="text-lg font-bold">IIIT-Delhi · Gate Entry</span>
        </div>
        <h1 className="mt-6 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          No ID card. No register. <span className="text-brand">Just your live QR.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 sm:text-lg">
          Sign in with your IIITD account, generate a live QR on your phone and show it at the gate. The guard scans it and your entry or exit is recorded digitally, with
          your details and the time. The QR changes every few seconds and only works from your own phone, so it can&apos;t be shared.
        </p>
        <div className="mt-8">
          <Link href="/login" className="btn-primary btn-lg">
            Sign in with IIITD account
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: QrCode, t: "Students", d: "Generate a live QR (5 minutes, refreshes every 15 s) and show it at the gate. See your own entries and exits." },
            { icon: ScanLine, t: "Guards", d: "Scan the QR and check the photo, name and roll no. Entry or exit is recorded automatically." },
            { icon: ClipboardList, t: "Digital register", d: "Every entry and exit with name, roll no., programme, gate and time. Searchable and downloadable." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card">
              <Icon className="h-6 w-6 text-brand" />
              <div className="mt-2 font-semibold">{t}</div>
              <div className="mt-1 text-sm text-slate-600">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
