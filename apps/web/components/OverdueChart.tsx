"use client";

import { useMemo, useState } from "react";
import { computeOverdueMain, computeOverdueEuro, type Draw } from "@rua-winner/core";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

type Mode = "main" | "euro";

export function OverdueChart({ draws }: { draws: Draw[] }) {
    const [mode, setMode] = useState<Mode>("main");

    const data = useMemo(() => {
        if (!draws.length) return [];
        const points = mode === "main" ? computeOverdueMain(draws) : computeOverdueEuro(draws);
        return points
            .sort((a, b) => b.overdue - a.overdue)
            .slice(0, 15)
            .map((p) => ({
                label: mode === "main" ? `#${p.num}` : `E${p.num}`,
                overdue: p.overdue,
                lastSeen: p.lastSeen ?? "never"
            }));
    }, [draws, mode]);

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-semibold">Most Overdue Numbers</h3>
                <div className="inline-flex rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                    <button
                        className={`px-3 py-1 text-sm ${mode === "main" ? "bg-brand-600 text-white" : "btn-ghost"}`}
                        onClick={() => setMode("main")}
                        aria-pressed={mode === "main"}
                    >
                        Main (1–50)
                    </button>
                    <button
                        className={`px-3 py-1 text-sm ${mode === "euro" ? "bg-brand-600 text-white" : "btn-ghost"}`}
                        onClick={() => setMode("euro")}
                        aria-pressed={mode === "euro"}
                    >
                        Euro (1–12)
                    </button>
                </div>
            </div>

            {!draws.length ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">No data.</div>
            ) : (
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="overdue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Overdue = number of draws since the last appearance (or total draws if never seen).
            </p>
        </div>
    );
}
