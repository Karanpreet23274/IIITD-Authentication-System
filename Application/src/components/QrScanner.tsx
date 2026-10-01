"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, ScanLine, X } from "lucide-react";

// Remembered for this tab so the camera reopens after the guard taps Done on a result.
const CAM_KEY = "qr-camera-open";

/**
 * Two input paths for the gate reader:
 *  • phone/tablet camera (html5-qrcode), shown full screen with the viewfinder centred
 *  • a hardware QR scanner in keyboard-wedge mode (types the code + Enter into the field)
 */
export default function QrScanner({ onScan, disabled, busy, controls }: { onScan: (raw: string) => void; disabled?: boolean; busy?: boolean; controls?: ReactNode }) {
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const inputRef = useRef<HTMLInputElement>(null);

  const openCam = (on: boolean) => {
    setCamOn(on);
    if (on) setCamErr(null);
    try {
      if (on) sessionStorage.setItem(CAM_KEY, "1");
      else sessionStorage.removeItem(CAM_KEY);
    } catch {}
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CAM_KEY)) setCamOn(true);
    } catch {}
  }, []);

  const emit = (v: string) => {
    const now = Date.now();
    if (disabledRef.current) return;
    if (v === last.current.v && now - last.current.t < 30_000) return; // same code read twice by the camera
    last.current = { v, t: now };
    onScanRef.current(v);
  };

  useEffect(() => {
    if (!camOn) return;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let stopped = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        scanner = new Html5Qrcode("qr-reader", { verbose: false });
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.8, height: Math.min(w, h) * 0.8 }) }, (decoded) => emit(decoded), () => {});
      } catch (e) {
        setCamErr((e as Error)?.message || "Camera unavailable");
        openCam(false);
      }
    })();
    return () => {
      stopped = true;
      scanner
        ?.stop()
        .then(() => scanner?.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn]);

  // While the camera is open: no page scrolling behind it, and Esc closes it.
  useEffect(() => {
    if (!camOn) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openCam(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [camOn]);

  useEffect(() => {
    if (!camOn) inputRef.current?.focus();
  }, [camOn, disabled]);

  return (
    <div className="space-y-3">
      {camErr && <div className="text-xs text-red-700">Camera: {camErr}</div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-dark" onClick={() => openCam(true)}>
          <Camera className="h-4 w-4" /> Scan with camera
        </button>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) emit(text.trim());
            setText("");
          }}
        >
          <input
            ref={inputRef}
            className="input font-mono text-xs"
            placeholder="Hardware scanner input…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Scanner input"
            autoComplete="off"
          />
          <button className="btn-outline" aria-label="Submit scan">
            <ScanLine className="h-4 w-4" />
          </button>
        </form>
      </div>

      {camOn &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade_in" role="dialog" aria-modal="true" aria-label="Camera scanner">
            <div className="flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="font-semibold">Scan the student&apos;s QR</div>
              <button type="button" onClick={() => openCam(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Close camera">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
              <div className="relative w-full max-w-sm md:max-w-md">
                <div id="qr-reader" className="aspect-square w-full overflow-hidden rounded-2xl bg-black [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover" />
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-white/70">Hold the student&apos;s phone inside the square. Only a live QR is accepted.</p>
            </div>
            <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {controls}
              <button type="button" onClick={() => openCam(false)} className="w-full rounded-xl border border-white/30 py-3 font-semibold hover:bg-white/10">
                Close camera
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
