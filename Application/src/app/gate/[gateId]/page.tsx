"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Volume2 } from "lucide-react";
import { ToneIcon, type Tone } from "@/components/ui";

type Display = {
  gate: { id: string; name: string };
  lane: "ONLINE" | "OFFLINE" | "MANUAL" | "EMERGENCY" | "CLOSED";
  display: { state: "IDLE" } | { state: "RESULT"; decision: string; tone: Tone; title: string; titleHi: string };
  at: string | null;
};

const BG: Record<Tone, string> = { allow: "bg-allow", warn: "bg-warn", deny: "bg-deny", neutral: "bg-[#334155]" };

// User-facing gate indicator (S01 idle, S04 success, S06–S09 denial). Shows colour, icon and a
// short respectful message only. Never a name or a reason (PRIV-10, DP-13).
export default function GateIndicator({ params }: { params: { gateId: string } }) {
  const [d, setD] = useState<Display | null>(null);
  const [err, setErr] = useState(false);
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const lastAt = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/gate/${params.gateId}/display`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Display;
        if (!alive) return;
        setErr(false);
        setD(j);
        if (j.display.state === "RESULT" && j.at && j.at !== lastAt.current) {
          lastAt.current = j.at;
          beep(j.display.tone);
        }
      } catch {
        if (alive) setErr(true);
      }
    };
    tick();
    const t = setInterval(tick, 700);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.gateId]);

  function beep(tone: Tone) {
    const ctx = audio.current;
    if (!ctx) return;
    const notes = tone === "allow" ? [880, 1320] : tone === "warn" ? [520, 520] : [300, 220];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.25, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      o.start(t0);
      o.stop(t0 + 0.17);
    });
  }

  const laneDot = !d || err ? "bg-[#94a3b8]" : d.lane === "ONLINE" ? "bg-[#4ade80]" : d.lane === "CLOSED" ? "bg-[#94a3b8]" : "bg-[#fbbf24]";
  const laneText = err ? "Connecting…" : d?.lane === "ONLINE" ? "Ready" : d?.lane === "OFFLINE" ? "Offline mode" : d?.lane === "CLOSED" ? "Gate closed" : d ? `${d.lane} mode` : "…";

  if (d?.display.state === "RESULT") {
    const r = d.display;
    return (
      <main className={`flex min-h-screen flex-col items-center justify-center p-6 text-center text-white ${BG[r.tone]}`} role="status" aria-live="assertive">
        <div className="rounded-full bg-white/20 p-8">
          <ToneIcon tone={r.tone} className="h-32 w-32 sm:h-48 sm:w-48" />
        </div>
        <h1 className="mt-8 max-w-3xl text-3xl font-extrabold sm:text-5xl">{r.title}</h1>
        <p className="mt-3 text-xl font-medium opacity-90 sm:text-3xl">{r.titleHi}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#0f172a] p-6 text-white">
      <div className="flex w-full items-center justify-between text-sm text-[#cbd5e1]">
        <span>
          {d?.gate.name ?? params.gateId}
        </span>
        <span className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${laneDot}`} /> {laneText}
        </span>
      </div>
      {d?.lane === "CLOSED" ? (
        <div className="text-center">
          <div className="text-4xl font-extrabold">Gate closed</div>
          <div className="mt-2 text-xl text-[#cbd5e1]">गेट बंद है · Please use another gate</div>
        </div>
      ) : (
        <div className="text-center">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <span className="absolute inset-0 animate-pulse_ring rounded-full border-4 border-[#2dd4bf]" />
            <QrCode className="h-24 w-24 text-[#5eead4]" />
          </div>
          <div className="mt-8 text-3xl font-extrabold sm:text-5xl">Show your gate QR to the guard</div>
          <div className="mt-3 text-xl text-[#cbd5e1] sm:text-2xl">अपना गेट QR गार्ड को दिखाएँ</div>
          <div className="mt-6 text-sm text-[#94a3b8]">Open the IIITD Gate app → Generate gate QR · screenshots are not accepted</div>
        </div>
      )}
      {!sound ? (
        <button
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm"
          onClick={() => {
            audio.current = new AudioContext();
            setSound(true);
          }}
        >
          <Volume2 className="h-4 w-4" /> Enable sound (kiosk setup)
        </button>
      ) : (
        <div className="h-9" />
      )}
    </main>
  );
}
