"use client";

import { useMemo, useState } from "react";
import { useData } from "./DataContext";
import { computePrizeStats, type PrizeClass } from "@rua-winner/core";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

type Metric = "count" | "avg";

function formatEuros(v: number) {
    return v.toLocaleString(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function PrizeClassChart() {
    const { draws } = useData();
    const [metric, setMetric] = useState<Metric>("count");

    const data = useMemo(() => {
        const stats = computePrizeStats(draws);
        // Recharts prefers plain arrays of objects; include label strings too.
        return stats.map((s) => ({
            cls: s.cls,
            label: `GKL${s.cls}`,
            count: s.count,
            avg: s.avg
        }));
    }, [draws]);

    const yTickFormatter = (v: number) => {
        return metric === "count" ? v.toLocaleString() : formatEuros(v);
    };

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-semibold">Prize Class Distribution</h3>
                <div className="inline-flex rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                    <button
                        className={`px-3 py-1 text-sm ${metric === "count" ? "bg-brand-600 text-white" : "btn-ghost"}`}
                        onClick={() => setMetric("count")}
                        aria-pressed={metric === "count"}
                    >
                        Count
                    </button>
                    <button
                        className={`px-3 py-1 text-sm ${metric === "avg" ? "bg-brand-600 text-white" : "btn-ghost"}`}
                        onClick={() => setMetric("avg")}
                        aria-pressed={metric === "avg"}
                    >
                        Avg €
                    </button>
                </div>
            </div>

            {!draws.length ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Import data to view prize class distribution.
                </div>
            ) : (
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="label" />
                            <YAxis tickFormatter={yTickFormatter} />
                            <Tooltip
                                formatter={(value: any) =>
                                    metric === "count" ? value.toLocaleString() : formatEuros(Number(value))
                                }
                                labelFormatter={(label: any) => String(label)}
                            />
                            <Bar dataKey={metric} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Count = number of draws where winners existed in that class. Avg € = average payout among those draws.
            </p>
        </div>
    );
}
