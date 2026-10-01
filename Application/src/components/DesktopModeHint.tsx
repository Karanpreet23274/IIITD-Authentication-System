"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, X } from "lucide-react";

/**
 * Chrome's "Desktop site" setting makes a phone ignore the page's mobile viewport and lay
 * the page out ~980 px wide, so everything looks tiny (the installed app inherits it).
 * A website can't switch that off, so detect it and tell the user how to.
 */
export default function DesktopModeHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("desktop-hint-dismissed") === "1") return;
    } catch {}
    const check = () => {
      const touch = navigator.maxTouchPoints > 0;
      const shortSide = Math.min(screen.width, screen.height);
      // A phone (short side < 600 CSS px) whose layout is far wider than its screen.
      setShow(touch && shortSide < 600 && window.innerWidth > shortSide * 1.6 && window.innerWidth >= 800);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!show) return null;
  return (
    <div role="alert" className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <MonitorSmartphone className="mt-0.5 h-7 w-7 shrink-0" />
        <div className="flex-1 text-[15px] leading-snug">
          <b>Your phone is showing the desktop version</b>, so everything looks small. In <b>Chrome</b> tap <b>⋮</b> and untick <b>Desktop site</b>. For the
          installed app, do this in Chrome for this site, then reopen the app.
        </div>
        <button
          aria-label="Dismiss"
          className="rounded p-1 text-amber-800"
          onClick={() => {
            setShow(false);
            try {
              sessionStorage.setItem("desktop-hint-dismissed", "1");
            } catch {}
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
