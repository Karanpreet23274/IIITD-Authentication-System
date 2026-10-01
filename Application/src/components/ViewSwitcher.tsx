"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List, Square, Table2, type LucideIcon } from "lucide-react";

export type ViewMode = "grid" | "list" | "large" | "table";

const VIEWS: Record<ViewMode, { label: string; icon: LucideIcon }> = {
  grid: { label: "Grid", icon: LayoutGrid },
  list: { label: "List", icon: List },
  large: { label: "Large", icon: Square },
  table: { label: "Table", icon: Table2 },
};

/**
 * View choice for a page, remembered on this device. `narrowFallback` is used instead of
 * `fallback` on phone-width screens until the person picks a view themselves.
 */
export function useViewMode(key: string, fallback: ViewMode, allowed: ViewMode[], narrowFallback?: ViewMode) {
  const [mode, setMode] = useState<ViewMode>(fallback);
  useEffect(() => {
    let saved: ViewMode | null = null;
    try {
      saved = localStorage.getItem(`view:${key}`) as ViewMode | null;
    } catch {}
    if (saved && allowed.includes(saved)) setMode(saved);
    else if (narrowFallback && window.innerWidth < 640) setMode(narrowFallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: ViewMode) => {
    setMode(v);
    try {
      localStorage.setItem(`view:${key}`, v);
    } catch {}
  };
  return [mode, set] as const;
}

/** Segmented Grid / List / Large / Table switch. Labels hide on narrow screens. */
export default function ViewSwitcher({ value, onChange, views }: { value: ViewMode; onChange: (v: ViewMode) => void; views: ViewMode[] }) {
  return (
    <div role="radiogroup" aria-label="View" className="inline-flex shrink-0 gap-0.5 rounded-xl bg-slate-100 p-1">
      {views.map((v) => {
        const { label, icon: Icon } = VIEWS[v];
        const on = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={on}
            aria-label={`${label} view`}
            title={`${label} view`}
            onClick={() => onChange(v)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${on ? "bg-surface text-slate-900 shadow" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden md:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
