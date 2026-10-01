"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { QrCode, Smartphone, ChevronRight, LogIn, LogOut, Ban } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { useDeviceState } from "@/lib/client/useDeviceState";
import { Photo, fetcher, fmt } from "@/components/ui";

type Hist = { movements: { id: string; ts: string; direction: "IN" | "OUT"; gate: string }[] };

export default function StudentHome() {
  const router = useRouter();
  const { data: me, error } = useMe();
  const device = useDeviceState(me);
  const { data: hist } = useSWR<Hist>("/api/student/history", fetcher);

  useEffect(() => {
    if (me && !me.identity.profileAt) router.replace("/student/setup");
  }, [me, router]);

  if (error) return <div className="card text-red-700">{error.message}</div>;
  if (!me || !me.identity.profileAt) return <div className="card h-40 animate-pulse" />;

  const i = me.identity;
  const blocked = me.credentials.some((c) => c.status === "BLOCKED");
  const needsEnrol = !device.loading && !device.deviceId;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="card flex items-center gap-4">
          <Photo src={i.photoUrl} alt="Your photo" className="h-20 w-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold">{i.fullName}</div>
            <div className="text-sm text-slate-500">
              {i.rollNo} · {i.programme} · {i.batch}
            </div>
            <div className="text-sm text-slate-500">{i.residence === "HOSTELLER" ? `Hosteller · ${i.hostelRoom}` : "Day scholar"}</div>
          </div>
          <div className={`rounded-xl px-3 py-2 text-center text-xs font-bold ${i.presence === "IN" ? "bg-green-50 text-green-800" : i.presence === "OUT" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500"}`}>
            {i.presence === "IN" ? "ON CAMPUS" : i.presence === "OUT" ? "OUTSIDE" : "NO RECORD"}
            {i.presenceAt && <div className="mt-0.5 font-normal">since {fmt(i.presenceAt)}</div>}
          </div>
        </div>

        {blocked ? (
          <div className="card flex items-center gap-4 border-red-300 bg-red-50">
            <Ban className="h-10 w-10 shrink-0 text-deny" />
            <div>
              <div className="font-bold">Your gate pass is blocked</div>
              <div className="text-sm text-slate-700">Please visit the Security Office.</div>
            </div>
          </div>
        ) : needsEnrol ? (
          <Link href="/student/setup?step=phone" className="card flex items-center gap-4 border-amber-300 bg-amber-50">
            <Smartphone className="h-10 w-10 shrink-0 text-warn" />
            <div className="flex-1">
              <div className="font-bold">Enrol this phone to get your QR pass</div>
              <div className="text-sm text-slate-600">Your QR can only be generated on one enrolled phone.</div>
            </div>
            <ChevronRight className="text-slate-400" />
          </Link>
        ) : (
          <Link href="/student/pass" className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand to-teal-500 p-6 text-white shadow-lg transition hover:shadow-xl">
            <QrCode className="h-14 w-14 shrink-0" />
            <div className="flex-1">
              <div className="text-xl font-extrabold">Generate gate QR</div>
              <div className="text-sm opacity-90">
                Show it to the guard to {i.presence === "IN" ? "exit" : "enter"} · live for 5 minutes
              </div>
            </div>
            <ChevronRight />
          </Link>
        )}
        <p className="text-xs text-slate-500">No ID card or paper register needed: the guard scans your QR and your entry/exit is recorded digitally.</p>
      </div>

      <div className="card h-fit">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent entries & exits</h2>
          <Link href="/student/history" className="text-sm font-semibold text-brand">
            All
          </Link>
        </div>
        <ul className="space-y-2">
          {!hist?.movements.length && <li className="text-sm text-slate-500">No records yet.</li>}
          {hist?.movements.slice(0, 8).map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              {m.direction === "IN" ? <LogIn className="h-4 w-4 text-allow" /> : <LogOut className="h-4 w-4 text-slate-500" />}
              <span className="font-medium">{m.direction === "IN" ? "Entry" : "Exit"}</span>
              <span className="text-slate-500">· {m.gate}</span>
              <span className="ml-auto text-xs text-slate-500">{fmt(m.ts)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
