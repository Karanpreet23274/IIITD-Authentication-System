"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Camera, Flashlight, FlashlightOff, Loader2, ScanLine, X, ZoomIn } from "lucide-react";

// Remembered for this tab so the camera reopens after the guard taps Done on a result.
const CAM_KEY = "qr-camera-open";
// Largest side of the frame handed to the JS decoder. The pass QR is dense (~65–77 modules),
// so it must be decoded near camera resolution, not at the on-screen size of the viewfinder.
const MAX_DECODE_PX = 1080;

type Zoom = { min: number; max: number; step: number; value: number };
type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/**
 * Two input paths for the gate reader:
 *  • phone/tablet camera, shown full screen with the viewfinder centred. Uses the phone's
 *    built-in QR reader (BarcodeDetector) when there is one, otherwise jsQR, both on the
 *    full-resolution frame.
 *  • a hardware QR scanner in keyboard-wedge mode (types the code + Enter into the field)
 */
export default function QrScanner({ onScan, disabled, busy, controls }: { onScan: (raw: string) => void; disabled?: boolean; busy?: boolean; controls?: ReactNode }) {
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [text, setText] = useState("");
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [torch, setTorch] = useState<boolean | null>(null); // null = phone has no torch control
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

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
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setStarting(true);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        // Keep refocusing as the student's phone moves closer or further away.
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (stopped) return;
        setStarting(false);

        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number }; torch?: boolean };
        const settings = track.getSettings() as MediaTrackSettings & { zoom?: number };
        if (caps.zoom && caps.zoom.max > caps.zoom.min) setZoom({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1, value: settings.zoom ?? caps.zoom.min });
        if (caps.torch) setTorch(false);

        // Decoder: the phone's own QR reader if it has one, else jsQR.
        let detector: Detector | null = null;
        const BD = (window as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector;
        if (BD && (await BD.getSupportedFormats().catch(() => [] as string[])).includes("qr_code")) detector = new BD({ formats: ["qr_code"] });
        const jsQR = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        const tick = async () => {
          if (stopped) return;
          try {
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            if (vw && vh && !disabledRef.current) {
              // Decode the centre square: exactly what the guard sees in the viewfinder.
              const side = Math.min(vw, vh);
              const out = Math.min(side, MAX_DECODE_PX);
              canvas.width = out;
              canvas.height = out;
              ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, out, out);
              let value: string | null = null;
              if (detector) {
                const codes = await detector.detect(canvas);
                value = codes[0]?.rawValue ?? null;
              } else if (jsQR) {
                const img = ctx.getImageData(0, 0, out, out);
                value = jsQR(img.data, out, out, { inversionAttempts: "dontInvert" })?.data ?? null;
              }
              if (value) emit(value);
            }
          } catch {}
          if (!stopped) timer = setTimeout(tick, detector ? 80 : 150);
        };
        tick();
      } catch (e) {
        if (stopped) return;
        const err = e as Error;
        setCamErr(err?.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access for this site and try again." : err?.message || "Camera unavailable");
        openCam(false);
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
      setStarting(false);
      setZoom(null);
      setTorch(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn]);

  const applyZoom = (v: number) => {
    setZoom((z) => (z ? { ...z, value: v } : z));
    trackRef.current?.applyConstraints({ advanced: [{ zoom: v } as MediaTrackConstraintSet] }).catch(() => {});
  };
  const toggleTorch = () => {
    const on = !torch;
    trackRef.current
      ?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      .then(() => setTorch(on))
      .catch(() => {});
  };

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
              <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black md:max-w-md">
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                {/* Aiming guide */}
                <div className="pointer-events-none absolute inset-[8%]" aria-hidden>
                  <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-white" />
                  <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-white" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-white" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-white" />
                </div>
                {torch !== null && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`absolute right-3 top-3 rounded-full p-2.5 ${torch ? "bg-yellow-300 text-black" : "bg-black/50 text-white"}`}
                    aria-label={torch ? "Turn torch off" : "Turn torch on"}
                    aria-pressed={torch}
                  >
                    {torch ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
                  </button>
                )}
                {(busy || starting) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                )}
              </div>
              {zoom && (
                <label className="flex w-full max-w-sm items-center gap-3 text-sm md:max-w-md">
                  <ZoomIn className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="sr-only">Zoom</span>
                  <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={zoom.value} onChange={(e) => applyZoom(Number(e.target.value))} className="flex-1 accent-white" />
                  <span className="w-10 text-right tabular-nums">{zoom.value.toFixed(1)}×</span>
                </label>
              )}
              <p className="max-w-sm text-center text-sm text-white/70">
                Hold the QR about 20–30 cm away so it&apos;s sharp{zoom ? ", and zoom in if it looks small" : ""}. Only a live QR is accepted.
              </p>
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
