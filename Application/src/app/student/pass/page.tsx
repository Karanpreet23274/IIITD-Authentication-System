"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Eye, RefreshCw, Smartphone, Sun, TimerOff, ShieldCheck } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { useDeviceState } from "@/lib/client/useDeviceState";
import { deviceSign } from "@/lib/client/device";
import { ErrorNote, Photo, postJSON } from "@/components/ui";

type TokenResp =
  | { state: "LIVE"; body: string; sig: string; exp: number; serverTime: number; expiresAt: string; liveColour: { name: string; hex: string } }
  | { state: "USED"; usedAt: string }
  | { state: "EXPIRED" | "ENDED" };

type Phase = "idle" | "starting" | "live" | "used" | "expired" | "error";

const REVEAL_SECONDS = 30;

export default function LivePassPage() {
  const { data: me } = useMe();
  const device = useDeviceState(me);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [usedDir, setUsedDir] = useState<"IN" | "OUT" | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [qr, setQr] = useState<string | null>(null);
  const [tokenExp, setTokenExp] = useState<number>(0);
  const [colour, setColour] = useState<{ name: string; hex: string } | null>(null);
  const [skew, setSkew] = useState(0); // server − client clock (ms)
  const [now, setNow] = useState(Date.now());
  const [revealUntil, setRevealUntil] = useState(0);
  const [hidden, setHidden] = useState(false);
  const rotateRef = useRef(15);
  const fetching = useRef(false);
  const started = useRef(false); // StrictMode runs effects twice; start only one session

  // ---- clock tick (drives countdown, live clock, watermark) ----
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // ---- hide the QR whenever the page is not in the foreground ----
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState !== "visible");
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // ---- keep the screen awake while the pass is live ----
  useEffect(() => {
    if (phase !== "live" || !("wakeLock" in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    (navigator as unknown as { wakeLock: { request: (t: string) => Promise<typeof lock> } }).wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [phase]);

  const fetchToken = useCallback(
    async (sessionId: string) => {
      if (!device.keyPair || fetching.current) return;
      fetching.current = true;
      try {
        const r = await postJSON<TokenResp>("/api/pass/token", { sid: sessionId });
        if (r.state === "LIVE") {
          const devSig = await deviceSign(device.keyPair.privateKey, `IIITD1.${r.body}.${r.sig}`);
          setQr(`IIITD1.${r.body}.${r.sig}.${devSig}`);
          setTokenExp(r.exp * 1000);
          setColour(r.liveColour);
          setSkew(r.serverTime - Date.now());
          setExpiresAt(new Date(r.expiresAt).getTime());
          setPhase("live");
        } else if (r.state === "USED") {
          fetch(`/api/pass/token?sid=${encodeURIComponent(sessionId)}`)
            .then((x) => x.json())
            .then((x) => setUsedDir(x.direction ?? null))
            .catch(() => {});
          setPhase("used");
          setQr(null);
        } else {
          setPhase("expired");
          setQr(null);
        }
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        fetching.current = false;
      }
    },
    [device.keyPair],
  );

  const start = useCallback(async () => {
    if (!device.deviceId) return;
    setErr(null);
    setPhase("starting");
    try {
      const r = await postJSON<{ sid: string; expiresAt: string; rotateSeconds: number }>("/api/pass/session", { deviceId: device.deviceId });
      rotateRef.current = r.rotateSeconds;
      setSid(r.sid);
      setExpiresAt(new Date(r.expiresAt).getTime());
      setRevealUntil(Date.now() + REVEAL_SECONDS * 1000);
      await fetchToken(r.sid);
    } catch (e) {
      setErr((e as Error).message);
      setPhase("error");
    }
  }, [device.deviceId, fetchToken]);

  // Resume an existing live session on this device, otherwise start a new one.
  useEffect(() => {
    if (phase !== "idle" || device.loading || !device.deviceId || !me || started.current) return;
    started.current = true;
    const s = me.activeSession;
    if (s && s.deviceId === device.deviceId && new Date(s.expiresAt).getTime() > Date.now()) {
      setSid(s.id);
      setExpiresAt(new Date(s.expiresAt).getTime());
      setRevealUntil(Date.now() + REVEAL_SECONDS * 1000);
      setPhase("starting");
      fetchToken(s.id);
    } else start();
  }, [phase, device.loading, device.deviceId, me, start, fetchToken]);

  // Rotate the QR token every N seconds.
  useEffect(() => {
    if (phase !== "live" || !sid) return;
    const t = setInterval(() => fetchToken(sid), rotateRef.current * 1000);
    return () => clearInterval(t);
  }, [phase, sid, fetchToken]);

  // Poll quickly for "used" so the screen confirms the entry right after the scan.
  useEffect(() => {
    if (phase !== "live" || !sid) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pass/token?sid=${encodeURIComponent(sid)}`).then((x) => x.json());
        if (r.state === "USED") {
          setUsedDir(r.direction ?? null);
          setPhase("used");
          setQr(null);
          if ("vibrate" in navigator) navigator.vibrate?.([80, 40, 80]);
        } else if (r.state !== "LIVE") {
          setPhase("expired");
          setQr(null);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [phase, sid]);

  // Local expiry.
  useEffect(() => {
    if (phase === "live" && expiresAt && now > expiresAt) {
      setPhase("expired");
      setQr(null);
    }
  }, [now, expiresAt, phase]);

  // ---------- render ----------
  if (!me || device.loading) return <div className="card mx-auto h-96 max-w-md animate-pulse" />;

  if (!device.deviceId) {
    return (
      <div className="card mx-auto max-w-md space-y-3 text-center">
        <Smartphone className="mx-auto h-10 w-10 text-warn" />
        <h1 className="text-lg font-bold">This phone is not enrolled</h1>
        <p className="text-sm text-slate-600">A pass can only be generated on your enrolled phone. This is what makes it impossible to share.</p>
        <Link href="/student/setup?step=phone" className="btn-primary w-full">
          Enrol this phone
        </Link>
      </div>
    );
  }

  const serverNow = now + skew;
  const remaining = Math.max(0, Math.floor((expiresAt - serverNow) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const total = 300;
  const pct = Math.min(1, remaining / total);
  const tokenLeft = Math.max(0, (tokenExp - serverNow) / 1000);
  const revealed = now < revealUntil && !hidden;
  const clock = new Date(serverNow).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });

  if (phase === "used") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl bg-allow p-8 text-center text-white shadow-lg">
          <CheckCircle2 className="mx-auto h-20 w-20" />
          <div className="mt-3 text-3xl font-extrabold">{usedDir === "OUT" ? "Exit recorded" : "Entry recorded"}</div>
          <div className="text-lg opacity-90">{usedDir === "OUT" ? "निकास दर्ज — have a safe trip" : "प्रवेश दर्ज — welcome"}</div>
          <div className="mt-2 text-sm opacity-80">{clock}</div>
        </div>
        <p className="text-center text-sm text-slate-600">This pass has been used and can&apos;t be used again. Generate a new one next time.</p>
        <Link href="/student" className="btn-outline w-full">
          Done
        </Link>
      </div>
    );
  }

  if (phase === "expired" || phase === "error") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <ErrorNote msg={err} />
        <div className="card space-y-3 text-center">
          <TimerOff className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-bold">{phase === "expired" ? "Pass expired" : "Could not create a pass"}</h1>
          <p className="text-sm text-slate-600">Passes stay live for 5 minutes. Generate a new one when you are at the gate.</p>
          <button className="btn-primary btn-lg w-full" onClick={start}>
            <RefreshCw className="h-5 w-5" /> Generate new pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="no-capture mx-auto max-w-md" onContextMenu={(e) => e.preventDefault()}>
      <ErrorNote msg={err} />

      {/* The ticket — animated background + moving watermark make a static copy obvious */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <div className="absolute inset-0 animate-hue bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500" aria-hidden />
        <div className="pointer-events-none absolute -inset-1/2 animate-drift select-none opacity-[0.13]" aria-hidden>
          <div className="grid grid-cols-3 gap-x-6 gap-y-8 text-sm font-black uppercase text-white">
            {Array.from({ length: 60 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">
                {me.identity.firstName} · {clock}
              </span>
            ))}
          </div>
        </div>

        <div className="relative p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-5 w-5" /> IIITD LIVE ENTRY PASS
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
              </span>
              LIVE
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Photo src={me.identity.photoUrl} alt="" className="h-14 w-14 border-2 border-white/70" />
            <div className="min-w-0">
              <div className="truncate text-xl font-extrabold">{me.identity.firstName}</div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">{me.identity.rollNo} · {me.identity.programme}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono text-2xl font-bold tabular-nums">{clock}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">IST · live clock</div>
            </div>
          </div>

          {/* QR */}
          <div className="relative mx-auto mt-4 aspect-square w-full max-w-[300px] rounded-2xl bg-white p-3">
            {qr ? (
              <QRCodeSVG value={qr} level="M" size={512} className={`h-full w-full transition duration-300 ${revealed ? "" : "blur-xl"}`} aria-label="Entry QR code" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            )}
            {qr && !revealed && (
              <button onClick={() => setRevealUntil(Date.now() + REVEAL_SECONDS * 1000)} className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/40 text-slate-900">
                <Eye className="h-8 w-8" />
                <span className="text-sm font-bold">Tap to show QR at the scanner</span>
              </button>
            )}
            {/* refresh progress */}
            <div className="absolute inset-x-3 bottom-1.5 h-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-brand transition-all duration-200" style={{ width: `${Math.min(100, (tokenLeft / 20) * 100)}%` }} />
            </div>
          </div>

          {/* colour of the minute + countdown */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Colour of the minute</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ background: colour?.hex ?? "#fff" }} />
                <span className="font-bold">{colour?.name ?? "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
              <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="4" strokeDasharray={`${pct * 97.4} 97.4`} strokeLinecap="round" />
              </svg>
              <div>
                <div className="font-mono text-xl font-bold tabular-nums">
                  {mm}:{ss}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pass expires</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
        <li className="flex items-center gap-2">
          <Sun className="h-4 w-4 shrink-0" /> Turn up brightness and hold the QR flat under the scanner.
        </li>
        <li>• The code changes every {rotateRef.current} s and works once, only from this phone. Screenshots and forwarded copies are rejected.</li>
        <li>• The guard can match the colour of the minute and live clock on their screen.</li>
      </ul>
      <button
        className="btn-outline mt-4 w-full"
        onClick={async () => {
          await fetch("/api/pass/session", { method: "DELETE" });
          setPhase("expired");
          setQr(null);
        }}
      >
        Cancel pass
      </button>
    </div>
  );
}
