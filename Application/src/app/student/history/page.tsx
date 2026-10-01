"use client";

import useSWR from "swr";
import { LogIn, LogOut } from "lucide-react";
import { fetcher, fmt } from "@/components/ui";

type Hist = { movements: { id: string; ts: string; direction: "IN" | "OUT"; gate: string; offline: boolean }[] };

export default function HistoryPage() {
  const { data, error } = useSWR<Hist>("/api/student/history", fetcher);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My entries & exits</h1>
      {error && <div className="card text-red-700">{error.message}</div>}
      <div className="card">
        <ul className="divide-y divide-slate-100">
          {data?.movements.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              {m.direction === "IN" ? <LogIn className="h-5 w-5 text-allow" /> : <LogOut className="h-5 w-5 text-slate-500" />}
              <div className="flex-1">
                <div className="font-medium">{m.direction === "IN" ? "Entered campus" : "Left campus"}</div>
                <div className="text-xs text-slate-500">{m.gate}</div>
              </div>
              <div className="text-right text-sm">{fmt(m.ts)}</div>
            </li>
          ))}
          {data && !data.movements.length && <li className="py-6 text-center text-slate-500">No records yet.</li>}
        </ul>
      </div>
    </div>
  );
}
