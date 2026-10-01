"use client";

import useSWR from "swr";
import { DoorOpen } from "lucide-react";
import { fetcher } from "./ui";

type Gates = { gates: { id: string; name: string; enabled: boolean }[] };

export default function GatePicker({ onPick }: { onPick: (id: string) => void }) {
  const { data } = useSWR<Gates>("/api/gates", fetcher);
  return (
    <div className="card mx-auto max-w-xl">
      <DoorOpen className="h-8 w-8 text-brand" />
      <h1 className="mt-2 text-xl font-bold">Which gate is this device at?</h1>
      <p className="text-sm text-slate-500">Set once per device. Every scan is recorded against this gate.</p>
      <div className="mt-4 grid gap-2">
        {data?.gates.map((g) => (
          <button key={g.id} disabled={!g.enabled} onClick={() => onPick(g.id)} className="btn-outline btn-lg justify-between">
            <span>{g.name}</span>
            {!g.enabled && <span className="text-xs text-slate-400">disabled</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
