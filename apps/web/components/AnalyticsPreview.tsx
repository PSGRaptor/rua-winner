"use client";

import { useMemo } from "react";
import { useData } from "./DataContext";
import {
    computeMainFrequencies,
    computeEuroFrequencies,
    computeJackpotSeries
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
    Line
} from "recharts";
import { PrizeClassChart } from "./PrizeClassChart";

function TopMainNumbersChart() {
    const { draws } = useData();
    const data = useMemo(() => {
        const freq = computeMainFrequencies(draws);
        // Top 15 by frequency
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

function EuroNumbersChart() {
    const { draws } = useData();
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

function JackpotHistoryChart() {
    const { draws } = useData();
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
                Import your dataset to see analytics. (Charts use your full local data.)
            </div>
        );
    }
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <TopMainNumbersChart />
            <EuroNumbersChart />
            <PrizeClassChart />
            <div className="md:col-span-2">
                <JackpotHistoryChart />
            </div>
        </div>
    );
}
