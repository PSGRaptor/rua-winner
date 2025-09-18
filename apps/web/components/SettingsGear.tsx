"use client";

import { useEffect, useRef, useState } from "react";
import { useHeatmapMode } from "./HeatmapMode";
import { useAnalyticsSettings } from "./AnalyticsSettings";

export default function SettingsGear() {
    const { mode, setMode } = useHeatmapMode();
    const { flags, setFlag, reset } = useAnalyticsSettings();
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

    const Row = ({ label, k }: { label: string; k: keyof typeof flags }) => (
        <label className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <input
                type="checkbox"
                checked={flags[k]}
                onChange={(e) => setFlag(k, e.target.checked)}
                className="accent-emerald-600"
            />
            <span className="text-sm">{label}</span>
        </label>
    );

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label="Settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={() => setOpen(v => !v)}
            >
                <span className="text-lg">⚙️</span>
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[22rem] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900 shadow-lg p-3">
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

                    <div className="mt-3 mb-1 text-sm font-semibold">Show panels</div>
                    <div className="grid grid-cols-2 gap-1">
                        {/* Base */}
                        <Row label="Top Main" k="topMain" />
                        <Row label="Euro Numbers" k="euroNumbers" />
                        <Row label="Heatmaps" k="heatmaps" />
                        <Row label="Prize Classes" k="prizeClass" />
                        <Row label="Overdue Chart" k="overdueChart" />
                        <Row label="Jackpot History" k="jackpotHistory" />
                    </div>

                    <div className="mt-3 mb-1 text-xs uppercase tracking-wide text-slate-500">Advanced</div>
                    <div className="grid grid-cols-2 gap-1">
                        <Row label="Overdue Table" k="overdueTable" />
                        <Row label="Pairs Matrix" k="pairsMatrix" />
                        <Row label="Triplets" k="tripletsTable" />
                        <Row label="Co-occur Network" k="cooccurNet" />
                        <Row label="Consecutive" k="consecutive" />
                        <Row label="Sum Trend" k="sumTrend" />
                        <Row label="Range Hist" k="rangeHist" />
                        <Row label="Low/High" k="lowHigh" />
                        <Row label="Parity" k="parity" />
                        <Row label="Last Digit" k="lastDigit" />
                        <Row label="Modulo" k="modulo" />
                        <Row label="Position Bias" k="posBias" />
                        <Row label="Weekday Effect" k="weekdayEffect" />
                        <Row label="Monthly Season" k="monthlySeasonal" />
                        <Row label="Streaks" k="streaks" />
                        <Row label="Inter-arrival" k="interArrival" />
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={reset}
                            title="Reset all visibility toggles"
                        >
                            Reset to defaults
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
