"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

// Registers the service worker and exposes the browser's "install app" prompt.

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Pwa = { canPrompt: boolean; isIos: boolean; installed: boolean; install: () => Promise<void> };

const Ctx = createContext<Pwa>({ canPrompt: false, isIos: false, installed: false, install: async () => {} });

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
  };

  return <Ctx.Provider value={{ canPrompt: !!deferred, isIos, installed, install }}>{children}</Ctx.Provider>;
}

export const usePwa = () => useContext(Ctx);

/** Clears pages the service worker saved (called on sign-out). */
export function clearSavedPages() {
  navigator.serviceWorker?.controller?.postMessage("clear-pages");
}

/** "Install app" card: native prompt on Android/desktop Chrome, instructions on iPhone. Hidden once installed. */
export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const { canPrompt, isIos, installed, install } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem("install-dismissed") === "1");
    } catch {}
  }, []);
  if (installed || dismissed || (!canPrompt && !isIos)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("install-dismissed", "1");
    } catch {}
  };

  return (
    <div className={`relative flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 ${compact ? "p-3" : "p-4"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-bold text-slate-900">Install the IIITD Gate app</div>
        {canPrompt ? (
          <div className="text-slate-600">Opens full-screen from your home screen, so your QR is one tap away.</div>
        ) : (
          <div className="text-slate-600">
            In Safari tap <Share className="inline h-4 w-4 align-[-3px]" aria-label="Share" /> <b>Share</b>, then <b>Add to Home Screen</b>.
          </div>
        )}
      </div>
      {canPrompt && (
        <button className="btn-primary shrink-0 px-3 py-2" onClick={install}>
          <Download className="h-4 w-4" /> Install
        </button>
      )}
      <button onClick={dismiss} className="absolute right-1.5 top-1.5 rounded p-1 text-slate-400 hover:text-slate-600" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
