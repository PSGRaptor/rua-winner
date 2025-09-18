"use client";

import { useMemo } from "react";
import { computeMainFrequencies, computeEuroFrequencies, type Draw } from "@rua-winner/core";
import { useHeatmapMode } from "./HeatmapMode";

/** --------------------------------------------------------------------------
 * Color mapping helpers (no external deps, no new files)
 * -------------------------------------------------------------------------- */
type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
    const c = hex.replace("#", "");
    return {
        r: parseInt(c.slice(0, 2), 16),
        g: parseInt(c.slice(2, 4), 16),
        b: parseInt(c.slice(4, 6), 16),
    };
}

function lerpChannel(a: number, b: number, t: number) {
    return Math.round(a + (b - a) * t);
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
    return {
        r: lerpChannel(a.r, b.r, t),
        g: lerpChannel(a.g, b.g, t),
        b: lerpChannel(a.b, b.b, t),
    };
}

/**
 * Map normalized intensity [0..1] to a CSS color depending on mode.
 * - Player:        Red (cold)  -> Green (hot)
 * - DataScientist: Blue (cold) -> Red   (hot)
 * We also scale alpha slightly so low values are visually lighter.
 */
function mapHeatColor(intensity01: number, mode: "Player" | "DataScientist") {
    const t = Math.max(0, Math.min(1, intensity01));

    if (mode === "DataScientist") {
        const cold = hexToRgb("#2B6CB0"); // blue-600
        const hot = hexToRgb("#E53E3E");  // red-600
        const c = lerpRgb(cold, hot, t);
        const a = Math.max(0.10, 0.15 + 0.85 * t); // a bit more opaque when hotter
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    }

    // Player
    const cold = hexToRgb("#E53E3E");   // red-600
    const hot = hexToRgb("#38A169");    // green-600
    const c = lerpRgb(cold, hot, t);
    const a = Math.max(0.10, 0.15 + 0.85 * t);
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

/** --------------------------------------------------------------------------
 * Components
 * -------------------------------------------------------------------------- */

function MainNumbersHeatmap({ draws }: { draws: Draw[] }) {
    const { mode } = useHeatmapMode();

    const data = useMemo(() => {
        const freq = computeMainFrequencies(draws);
        const max = Math.max(1, ...freq.map((f) => f.freq));
        return { freq, max };
    }, [draws]);

    return (
        <div className="card p-4">
            <h3 className="font-semibold mb-3">Main Numbers Heatmap (1–50)</h3>
            {!draws.length ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">No data.</div>
            ) : (
                <>
                    <div className="grid grid-cols-10 gap-1">
                        {data.freq.map((f) => {
                            const intensity = f.freq / data.max; // normalized [0..1]
                            return (
                                <div
                                    key={f.num}
                                    className="rounded-md border border-slate-200/60 dark:border-slate-700/60 text-xs h-9 flex items-center justify-center"
                                    style={{ backgroundColor: mapHeatColor(intensity, mode) }}
                                    title={`#${f.num} • ${f.freq} hits`}
                                >
                                    {f.num}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        Color indicates frequency • Mode: <b>{mode}</b> • Max frequency: {data.max.toLocaleString()}
                    </div>
                </>
            )}
        </div>
    );
}

function EuroNumbersHeatmap({ draws }: { draws: Draw[] }) {
    const { mode } = useHeatmapMode();

    const data = useMemo(() => {
        const freq = computeEuroFrequencies(draws);
        const max = Math.max(1, ...freq.map((f) => f.freq));
        return { freq, max };
    }, [draws]);

    return (
        <div className="card p-4">
            <h3 className="font-semibold mb-3">Euro Numbers Heatmap (1–12)</h3>
            {!draws.length ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">No data.</div>
            ) : (
                <>
                    <div className="grid grid-cols-6 gap-1">
                        {data.freq.map((f) => {
                            const intensity = f.freq / data.max; // normalized [0..1]
                            return (
                                <div
                                    key={f.num}
                                    className="rounded-md border border-slate-200/60 dark:border-slate-700/60 text-xs h-9 flex items-center justify-center"
                                    style={{ backgroundColor: mapHeatColor(intensity, mode) }}
                                    title={`E${f.num} • ${f.freq} hits`}
                                >
                                    {f.num}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        Color indicates frequency • Mode: <b>{mode}</b> • Max frequency: {data.max.toLocaleString()}
                    </div>
                </>
            )}
        </div>
    );
}

export function Heatmaps({ draws }: { draws: Draw[] }) {
    return (
        <div className="space-y-6">
            <MainNumbersHeatmap draws={draws} />
            <EuroNumbersHeatmap draws={draws} />
        </div>
    );
}
