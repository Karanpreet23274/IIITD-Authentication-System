"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanLine } from "lucide-react";

/**
 * Two input paths for the gate reader:
 *  • tablet camera (html5-qrcode)
 *  • a hardware QR scanner in keyboard-wedge mode (types the code + Enter into the field)
 */
export default function QrScanner({ onScan, disabled }: { onScan: (raw: string) => void; disabled?: boolean }) {
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const inputRef = useRef<HTMLInputElement>(null);

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
        setCamOn(false);
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

  useEffect(() => {
    if (!camOn) inputRef.current?.focus();
  }, [camOn, disabled]);

  return (
    <div className="space-y-3">
      {camOn && <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black" />}
      {camErr && <div className="text-xs text-red-700">Camera: {camErr}</div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className={camOn ? "btn-outline" : "btn-dark"} onClick={() => setCamOn((v) => !v)}>
          {camOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {camOn ? "Stop camera" : "Scan with camera"}
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
    </div>
  );
}
