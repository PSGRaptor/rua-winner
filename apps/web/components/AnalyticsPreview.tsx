"use client";

import { useMemo, useState } from "react";
import { useData } from "./DataContext";
import {
    computeMainFrequencies,
    computeEuroFrequencies,
    computeJackpotSeries,
    type Draw,
} from "@rua-winner/core";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
} from "recharts";
import { PrizeClassChart } from "./PrizeClassChart";
import { Heatmaps } from "./Heatmaps";
import { OverdueChart } from "./OverdueChart";
import { HeatmapModeProvider } from "./HeatmapMode";
import SettingsGear from "./SettingsGear";

/** ✅ NEW: Advanced stats panel */
import { AdvancedAnalytics } from "./AdvancedAnalytics";

function TopMainNumbersChart({ draws }: { draws: Draw[] }) {
    const data = useMemo(() => {
        const freq = computeMainFrequencies(draws);
        return freq.sort((a, b) => b.freq - a.freq).slice(0, 15);
    }, [draws]);

    return (
        <div className="card p-4">
            <h3 className="font-semibold mb-2">Top Main Numbers (1–50)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="num" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="freq" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function EuroNumbersChart({ draws }: { draws: Draw[] }) {
    const data = useMemo(() => computeEuroFrequencies(draws), [draws]);

    return (
        <div className="card p-4">
            <h3 className="font-semibold mb-2">Euro Numbers (1–12)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="num" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="freq" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function JackpotHistoryChart({ draws }: { draws: Draw[] }) {
    const data = useMemo(() => {
        const series = computeJackpotSeries(draws);
        if (series.length > 1200) {
            const slim: typeof series = [];
            for (let i = 0; i < series.length; i += 2) slim.push(series[i]);
            return slim;
        }
        return series;
    }, [draws]);

    return (
        <div className="card p-4">
            <h3 className="font-semibold mb-2">Jackpot (GKL1) Over Time</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" minTickGap={24} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="jackpot" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function AnalyticsPreview() {
    const { draws } = useData();

    if (!draws.length) {
        return (
            <div className="text-sm text-slate-600 dark:text-slate-400">
                Import your dataset to see analytics. (Charts use your local data.)
            </div>
        );
    }

    // Slider = "latest N draws" (1..full)
    const [n, setN] = useState<number>(draws.length);
    const clamped = Math.max(1, Math.min(n, draws.length));

    const recentDraws = useMemo(() => {
        // take the last N draws (most recent window)
        return draws.slice(-clamped);
    }, [draws, clamped]);

    const fromDate = recentDraws[0]?.drawDate ?? "";
    const toDate = recentDraws[recentDraws.length - 1]?.drawDate ?? "";

    /** Provider is local to this analytics area only. */
    return (
        <HeatmapModeProvider>
            <div className="space-y-6">
                {/* Sticky scope controller */}
                <div
                    className="
            sticky top-16 z-30
            backdrop-blur bg-[rgb(var(--bg))]/80
            border border-slate-200/60 dark:border-slate-700/60
            shadow-soft rounded-2xl
            p-4
          "
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold">Scope: Latest N Draws</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Showing <b>{clamped.toLocaleString()}</b> of {draws.length.toLocaleString()} draws • {fromDate} → {toDate}
                            </div>
                            <SettingsGear />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-14">1</span>
                        <input
                            type="range"
                            min={1}
                            max={draws.length}
                            value={clamped}
                            onChange={(e) => setN(parseInt(e.target.value, 10))}
                            className="w-full"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-14 text-right">
              {draws.length.toLocaleString()}
            </span>
                        <input
                            type="number"
                            className="card px-3 py-2 w-24"
                            min={1}
                            max={draws.length}
                            value={clamped}
                            onChange={(e) => setN(parseInt(e.target.value || "1", 10))}
                            title="Set exact number of latest draws"
                        />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <button className="btn btn-ghost px-2 py-1" onClick={() => setN(50)}>Last 50</button>
                        <button className="btn btn-ghost px-2 py-1" onClick={() => setN(100)}>Last 100</button>
                        <button className="btn btn-ghost px-2 py-1" onClick={() => setN(250)}>Last 250</button>
                        <button className="btn btn-ghost px-2 py-1" onClick={() => setN(draws.length)}>All</button>
                    </div>
                </div>

                {/* Existing visuals */}
                <TopMainNumbersChart draws={recentDraws} />
                <EuroNumbersChart draws={recentDraws} />
                <Heatmaps draws={recentDraws} />
                <PrizeClassChart draws={recentDraws} />
                <OverdueChart draws={recentDraws} />
                <JackpotHistoryChart draws={recentDraws} />

                {/* ✅ NEW: Advanced analytics panel */}
                <AdvancedAnalytics draws={recentDraws} />
            </div>
        </HeatmapModeProvider>
    );
}
