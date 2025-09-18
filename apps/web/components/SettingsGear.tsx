"use client";

import { useEffect, useRef, useState } from "react";
import { useHeatmapMode } from "./HeatmapMode";

/**
 * Minimal settings gear with a small popover containing two radio options:
 *  - Player mode: Green = hot, Red = cold
 *  - Data Scientist mode: Red = hot, Blue = cold
 *
 * Tailwind-only; no new dependencies. Safe to place in any toolbar/header section.
 */
export default function SettingsGear() {
    const { mode, setMode } = useHeatmapMode();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label="Settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={() => setOpen((v) => !v)}
            >
                <span className="text-lg">⚙️</span>
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 shadow-lg p-3">
                    <div className="mb-2 text-sm font-semibold">Heatmap Mode</div>

                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                            type="radio"
                            name="heatmap-mode"
                            className="accent-emerald-600"
                            checked={mode === "Player"}
                            onChange={() => setMode("Player")}
                        />
                        <div>
                            <div className="text-sm font-medium">Player mode</div>
                            <div className="text-xs text-slate-500">Green = hot, Red = cold</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                            type="radio"
                            name="heatmap-mode"
                            className="accent-blue-600"
                            checked={mode === "DataScientist"}
                            onChange={() => setMode("DataScientist")}
                        />
                        <div>
                            <div className="text-sm font-medium">Data Scientist mode</div>
                            <div className="text-xs text-slate-500">Red = hot, Blue = cold</div>
                        </div>
                    </label>
                </div>
            )}
        </div>
    );
}
