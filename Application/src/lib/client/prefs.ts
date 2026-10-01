"use client";

import { useCallback, useEffect, useState } from "react";

// Per-device display preferences (Settings page). Stored in localStorage and applied to
// <html> as the "dark" class and data-text attribute. THEME_INIT_SCRIPT applies them
// before first paint so there is no flash of the wrong theme.

export type Theme = "system" | "light" | "dark";
export type TextSize = "normal" | "large" | "xl";

const read = <T extends string>(key: string, fallback: T, allowed: readonly T[]): T => {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

const systemDark = () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export function applyPrefs(theme: Theme, text: TextSize) {
  const el = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && systemDark());
  el.classList.toggle("dark", dark);
  if (text === "normal") delete el.dataset.text;
  else el.dataset.text = text;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b1215" : "#0f766e");
}

export function usePrefs() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [text, setTextState] = useState<TextSize>("normal");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const t = read<Theme>("theme", "system", ["system", "light", "dark"]);
    const s = read<TextSize>("textSize", "normal", ["normal", "large", "xl"]);
    setThemeState(t);
    setTextState(s);
    setIsDark(document.documentElement.classList.contains("dark"));
    // Follow the phone's light/dark switch while on "System".
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (read<Theme>("theme", "system", ["system", "light", "dark"]) === "system") {
        applyPrefs("system", read<TextSize>("textSize", "normal", ["normal", "large", "xl"]));
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
      setThemeState(t);
      applyPrefs(t, text);
      setIsDark(document.documentElement.classList.contains("dark"));
    },
    [text],
  );

  const setText = useCallback(
    (s: TextSize) => {
      try {
        localStorage.setItem("textSize", s);
      } catch {}
      setTextState(s);
      applyPrefs(theme, s);
    },
    [theme],
  );

  return { theme, text, isDark, setTheme, setText };
}
