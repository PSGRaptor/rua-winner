"use client";

import React, { useMemo } from "react";
import type { Draw } from "@rua-winner/core";
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
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useHeatmapMode } from "./HeatmapMode";

/**
 * AdvancedAnalytics
 * Consolidated panel rendering additional statistics.
 *
 * IMPORTANT: Your Draw type uses:
 * - d.z : [number,number,number,number,number]  // main numbers
 * - d.e : [number,number]                        // euro numbers
 * - d.drawDate : string "YYYY-MM-DD"
 *
 * We read ONLY these fields and do not touch @rua-winner/core.
 */

type RGB = { r: number; g: number; b: number };

/* --------------------------- Utilities & Accessors --------------------------- */

function getMain(d: Draw): number[] {
    const anyd = d as any;
    return Array.isArray(anyd.z) ? anyd.z : [];
}

function sortedUnique(arr: number[]) {
    return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function dateToWeekday(dateStr: string) {
    const d = new Date(dateStr);
    const wd = d.getUTCDay(); // 0 Sun .. 6 Sat
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][wd] ?? "N/A";
}

function arraySum(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0);
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function hex(h: string): RGB {
    const c = h.replace("#", "");
    return {
        r: parseInt(c.slice(0, 2), 16),
        g: parseInt(c.slice(2, 4), 16),
        b: parseInt(c.slice(4, 6), 16),
    };
}
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function mapHeatColor(intensity01: number, mode: "Player" | "DataScientist") {
    const t = clamp01(intensity01);
    if (mode === "DataScientist") {
        const cold = hex("#2B6CB0"), hot = hex("#E53E3E");
        const r = lerp(cold.r, hot.r, t), g = lerp(cold.g, hot.g, t), b = lerp(cold.b, hot.b, t);
        const a = 0.15 + 0.85 * t;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    const cold = hex("#E53E3E"), hot = hex("#38A169");
    const r = lerp(cold.r, hot.r, t), g = lerp(cold.g, hot.g, t), b = lerp(cold.b, hot.b, t);
    const a = 0.15 + 0.85 * t;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* --------------------------------- Metrics --------------------------------- */

function computeFrequencies(draws: Draw[], domainMax: number) {
    const freq = new Array(domainMax + 1).fill(0);
    for (const dr of draws) for (const n of getMain(dr)) if (n >= 1 && n <= domainMax) freq[n]++;
    const items = [];
    for (let n = 1; n <= domainMax; n++) items.push({ num: n, freq: freq[n] });
    return items;
}

function computeLastSeen(draws: Draw[], domainMax: number) {
    // index from the end; i=0 -> seen in the most recent draw
    const lastIndex: Array<number | null> = new Array(domainMax + 1).fill(null);
    const total = draws.length;
    for (let i = total - 1; i >= 0; i--) {
        const arr = getMain(draws[i]);
        for (const n of arr) if (lastIndex[n] == null) lastIndex[n] = total - 1 - i;
    }
    const nowAge = lastIndex.map((gap, n) => ({
        num: n,
        drawsSince: gap == null ? total : gap,
    })).slice(1);
    return nowAge.sort((a, b) => b.drawsSince - a.drawsSince);
}

function computeInterArrival(draws: Draw[], domainMax: number) {
    const perNumber: Record<number, number[]> = {};
    const indicesPerNumber: Record<number, number[]> = {};
    for (let n = 1; n <= domainMax; n++) { perNumber[n] = []; indicesPerNumber[n] = []; }

    for (let i = 0; i < draws.length; i++) for (const m of getMain(draws[i])) indicesPerNumber[m].push(i);
    for (let n = 1; n <= domainMax; n++) {
        const idx = indicesPerNumber[n];
        for (let k = 1; k < idx.length; k++) perNumber[n].push(idx[k] - idx[k - 1]);
    }
    return perNumber;
}

function computePairs(draws: Draw[], domainMax: number) {
    const size = domainMax + 1;
    const mat: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

    for (const dr of draws) {
        const arr = sortedUnique(getMain(dr));
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                const a = arr[i], b = arr[j];
                mat[a][b]++; mat[b][a]++;
            }
        }
    }

    const top: { a: number; b: number; count: number }[] = [];
    for (let a = 1; a <= domainMax; a++) for (let b = a + 1; b <= domainMax; b++) if (mat[a][b] > 0) top.push({ a, b, count: mat[a][b] });
    top.sort((x, y) => y.count - x.count);
    return { mat, top };
}

function computeTriplets(draws: Draw[], domainMax: number, topN = 50) {
    const map = new Map<string, number>();
    for (const dr of draws) {
        const arr = sortedUnique(getMain(dr));
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) for (let k = j + 1; k < arr.length; k++) {
            const key = `${arr[i]},${arr[j]},${arr[k]}`;
            map.set(key, (map.get(key) ?? 0) + 1);
        }
    }
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, topN);
}

function isConsecutivePair(a: number, b: number) { return b === a + 1; }

function computeConsecutive(draws: Draw[]) {
    let totalPairs = 0;
    const counts: Record<string, number> = {};
    for (const dr of draws) {
        const s = sortedUnique(getMain(dr));
        for (let i = 0; i < s.length - 1; i++) {
            if (isConsecutivePair(s[i], s[i + 1])) {
                totalPairs++;
                const key = `${s[i]}-${s[i + 1]}`;
                counts[key] = (counts[key] ?? 0) + 1;
            }
        }
    }
    return { totalPairs, counts };
}

type Edge = { a: number; b: number; w: number };
type Node = { id: number; x: number; y: number; deg: number };

function buildCoOccurrenceNetwork(draws: Draw[], domainMax: number, minWeight = 2, topEdges = 200) {
    const { mat } = computePairs(draws, domainMax);
    const edges: Edge[] = [];
    for (let a = 1; a <= domainMax; a++) for (let b = a + 1; b <= domainMax; b++) {
        const w = mat[a][b];
        if (w >= minWeight) edges.push({ a, b, w });
    }
    edges.sort((e1, e2) => e2.w - e1.w);
    const E = edges.slice(0, topEdges);

    const R = 140, cx = 180, cy = 180;
    const nodes: Node[] = [];
    for (let n = 1; n <= domainMax; n++) {
        const theta = (2 * Math.PI * (n - 1)) / domainMax;
        nodes.push({ id: n, x: cx + R * Math.cos(theta), y: cy + R * Math.sin(theta), deg: 0 });
    }
    for (const e of E) { nodes[e.a - 1].deg += e.w; nodes[e.b - 1].deg += e.w; }
    const maxW = E.reduce((m, e) => Math.max(m, e.w), 1);
    const maxDeg = nodes.reduce((m, n) => Math.max(m, n.deg), 1);
    return { nodes, edges: E, maxW, maxDeg, cx, cy, R };
}

function computeLowHigh(draws: Draw[]) {
    return draws.map((d) => {
        const m = getMain(d);
        const low = m.filter((n) => n <= 25).length;
        const high = m.length - low;
        return { date: (d as any).drawDate, low, high };
    });
}

function computeOddEven(draws: Draw[]) {
    return draws.map((d) => {
        const m = getMain(d);
        const odd = m.filter((n) => n % 2 === 1).length;
        const even = m.length - odd;
        return { date: (d as any).drawDate, odd, even };
    });
}

function computeLastDigit(draws: Draw[]) {
    const cnt = new Array(10).fill(0);
    for (const d of draws) for (const n of getMain(d)) cnt[n % 10]++;
    return cnt.map((c, digit) => ({ digit, count: c }));
}

function computeModulo(draws: Draw[], modBase: number) {
    const cnt = new Array(modBase).fill(0);
    for (const d of draws) for (const n of getMain(d)) cnt[n % modBase]++;
    return cnt.map((c, r) => ({ r, count: c }));
}

function computeSums(draws: Draw[]) {
    return draws.map((d) => ({ date: (d as any).drawDate, sum: arraySum(getMain(d)) }));
}

function computeRanges(draws: Draw[]) {
    return draws.map((d) => {
        const s = sortedUnique(getMain(d));
        return { date: (d as any).drawDate, range: s.length ? s[s.length - 1] - s[0] : 0 };
    });
}

function rollingMean(arr: number[], w: number) {
    const out: (number | null)[] = new Array(arr.length).fill(null);
    let acc = 0;
    for (let i = 0; i < arr.length; i++) {
        acc += arr[i];
        if (i >= w) acc -= arr[i - w];
        if (i >= w - 1) out[i] = acc / w;
    }
    return out;
}

function computeStreaks(draws: Draw[], domainMax: number) {
    const hotRuns: number[] = [];
    const coldRuns: number[] = [];

    const presence: boolean[][] = draws.map((d) => {
        const set = new Set(getMain(d));
        const row = new Array(domainMax + 1).fill(false);
        for (let n = 1; n <= domainMax; n++) row[n] = set.has(n);
        return row;
    });

    for (let n = 1; n <= domainMax; n++) {
        let cur = 0, mode: "hot" | "cold" | null = null;
        for (let i = 0; i < draws.length; i++) {
            const hit = presence[i][n];
            if (mode === null) {
                mode = hit ? "hot" : "cold";
                cur = 1;
            } else if ((mode === "hot" && hit) || (mode === "cold" && !hit)) {
                cur++;
            } else {
                if (mode === "hot") hotRuns.push(cur);
                else coldRuns.push(cur);
                mode = hit ? "hot" : "cold";
                cur = 1;
            }
        }
        if (mode === "hot") hotRuns.push(cur);
        else if (mode === "cold") coldRuns.push(cur);
    }

    hotRuns.sort((a, b) => a - b);
    coldRuns.sort((a, b) => a - b);
    return { hotRuns, coldRuns };
}

function computePositionBias(draws: Draw[], domainMax: number, positions = 5) {
    const mat: number[][] = Array.from({ length: positions }, () => new Array(domainMax + 1).fill(0));
    for (const d of draws) {
        const s = sortedUnique(getMain(d)).slice(0, positions);
        for (let i = 0; i < s.length; i++) {
            const n = s[i];
            if (n >= 1 && n <= domainMax) mat[i][n]++;
        }
    }
    const rows = mat.map((row) => {
        const max = Math.max(1, ...row);
        return row.map((v) => v / max);
    });
    return rows;
}

function computeWeekdayEffect(draws: Draw[]) {
    const by = new Map<string, number>();
    for (const d of draws) {
        const wd = (d as any).weekday ?? dateToWeekday((d as any).drawDate);
        by.set(wd, (by.get(wd) ?? 0) + 1);
    }
    const items = Array.from(by.entries()).map(([weekday, count]) => ({ weekday, count }));
    const order = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    items.sort((a, b) => order.indexOf(a.weekday) - order.indexOf(b.weekday));

    // simple heuristic badge: Tue vs Fri difference
    const tue = items.find(i => i.weekday === "Tue")?.count ?? 0;
    const fri = items.find(i => i.weekday === "Fri")?.count ?? 0;
    const total = items.reduce((s, i) => s + i.count, 0);
    const diff = Math.abs(tue - fri);
    const badge = diff > Math.sqrt(total) ? "likely" : "ns";
    return { items, badge };
}

function computeMonthlySeasonal(draws: Draw[]) {
    const by = new Array(12).fill(0);
    for (const d of draws) {
        const m = new Date((d as any).drawDate).getUTCMonth();
        by[m]++;
    }
    return by.map((count, i) => ({ month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], count }));
}

/* ============================== COMPONENT =============================== */

export function AdvancedAnalytics({ draws, domainMax = 50 }: { draws: Draw[]; domainMax?: number }) {
    const { mode } = useHeatmapMode();

    const freq = useMemo(() => computeFrequencies(draws, domainMax), [draws, domainMax]);
    const maxFreq = useMemo(() => Math.max(1, ...freq.map(f => f.freq)), [freq]);
    const lastSeen = useMemo(() => computeLastSeen(draws, domainMax), [draws, domainMax]);
    const interArrival = useMemo(() => computeInterArrival(draws, domainMax), [draws, domainMax]);
    const { mat: pairMat, top: topPairs } = useMemo(() => computePairs(draws, domainMax), [draws, domainMax]);
    const topTriplets = useMemo(() => computeTriplets(draws, domainMax, 50), [draws, domainMax]);
    const consecutive = useMemo(() => computeConsecutive(draws), [draws]);
    const sums = useMemo(() => computeSums(draws), [draws]);
    const ranges = useMemo(() => computeRanges(draws), [draws]);
    const lowHigh = useMemo(() => computeLowHigh(draws), [draws]);
    const oddEven = useMemo(() => computeOddEven(draws), [draws]);
    const lastDigit = useMemo(() => computeLastDigit(draws), [draws]);
    const mod5 = useMemo(() => computeModulo(draws, 5), [draws]);
    const mod7 = useMemo(() => computeModulo(draws, 7), [draws]);
    const mod10 = useMemo(() => computeModulo(draws, 10), [draws]);
    const posBias = useMemo(() => computePositionBias(draws, domainMax, 5), [draws, domainMax]);
    const weekday = useMemo(() => computeWeekdayEffect(draws), [draws]);
    const monthly = useMemo(() => computeMonthlySeasonal(draws), [draws]);
    const streaks = useMemo(() => computeStreaks(draws, domainMax), [draws, domainMax]);
    const network = useMemo(() => buildCoOccurrenceNetwork(draws, domainMax, 2, 200), [draws, domainMax]);

    const sumSeries = sums.map(s => s.sum);
    const mean50 = useMemo(() => rollingMean(sumSeries, Math.min(50, sumSeries.length)), [sumSeries]);
    const mean100 = useMemo(() => rollingMean(sumSeries, Math.min(100, sumSeries.length)), [sumSeries]);

    // Aggregate parity totals for the donut
    const oddTotal = oddEven.reduce((s, r) => s + r.odd, 0);
    const evenTotal = oddEven.reduce((s, r) => s + r.even, 0);

    return (
        <div className="space-y-6">
            {/* Last seen / Overdue */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Last Seen / Overdue (by draws since hit)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-xs text-slate-500">
                        <tr>
                            <th className="px-2 py-1 text-left">#</th>
                            <th className="px-2 py-1 text-left">Draws since</th>
                            <th className="px-2 py-1 text-left">Spark</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lastSeen.slice(0, 25).map((x) => (
                            <tr key={x.num} className="border-t border-slate-200/60 dark:border-slate-700/60">
                                <td className="px-2 py-1">{x.num}</td>
                                <td className="px-2 py-1">{x.drawsSince}</td>
                                <td className="px-2 py-1">
                                    <div className="h-6 w-40 bg-slate-100 dark:bg-slate-800 rounded">
                                        <div
                                            className="h-6 rounded"
                                            style={{
                                                width: `${Math.min(100, (freq[x.num - 1]?.freq ?? 0) / maxFreq * 100)}%`,
                                                background: mapHeatColor((freq[x.num - 1]?.freq ?? 0) / maxFreq, mode),
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pairs heatmap + Top list */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Pairs Frequency — Matrix & Top List</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Matrix */}
                    <div className="col-span-2 overflow-auto">
                        <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${domainMax}, 14px)` }}>
                            {Array.from({ length: domainMax }).map((_, i) =>
                                Array.from({ length: domainMax }).map((__, j) => {
                                    const a = i + 1, b = j + 1;
                                    const v = a === b ? 0 : pairMat[a]?.[b] ?? 0;
                                    const maxV = topPairs.length ? topPairs[0].count : 1;
                                    const t = maxV > 0 ? v / maxV : 0;
                                    return (
                                        <div
                                            key={`${a}-${b}`}
                                            className="h-[14px] w-[14px] border border-white/10"
                                            style={{ backgroundColor: mapHeatColor(t, mode) }}
                                            title={`${a}-${b}: ${v}`}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                    {/* Top list */}
                    <div>
                        <ol className="text-sm space-y-1">
                            {topPairs.slice(0, 30).map((p, idx) => (
                                <li key={`${p.a}-${p.b}`} className="flex items-center gap-2">
                                    <span className="text-slate-400 w-5">{idx + 1}.</span>
                                    <span className="w-16">#{p.a}-#{p.b}</span>
                                    <span className="text-slate-500">{p.count}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>

            {/* Triplets table */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Triplets Frequency — Top 50</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-xs text-slate-500">
                        <tr><th className="px-2 py-1 text-left">Triplet</th><th className="px-2 py-1 text-left">Count</th></tr>
                        </thead>
                        <tbody>
                        {topTriplets.map((t) => (
                            <tr key={t.key} className="border-t border-slate-200/60 dark:border-slate-700/60">
                                <td className="px-2 py-1">{t.key}</td>
                                <td className="px-2 py-1">{t.count}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Co-occurrence network (radial layout) */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Co-occurrence Network (Top links)</h3>
                <div className="overflow-x-auto">
                    <svg width={360} height={360} className="block mx-auto">
                        {/* edges */}
                        {network.edges.map((e, idx) => {
                            const A = network.nodes[e.a - 1], B = network.nodes[e.b - 1];
                            const t = e.w / Math.max(1, network.maxW);
                            return (
                                <line
                                    key={idx}
                                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                                    stroke={mapHeatColor(t, mode)}
                                    strokeWidth={1 + 3 * t}
                                    strokeOpacity={0.85}
                                />
                            );
                        })}
                        {/* nodes */}
                        {network.nodes.map((n) => {
                            const t = n.deg / Math.max(1, network.maxDeg);
                            return (
                                <g key={n.id}>
                                    <circle cx={n.x} cy={n.y} r={6 + 6 * t} fill={mapHeatColor(t, mode)} />
                                    <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize={10} fill="#111" className="dark:fill-white">
                                        {n.id}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
                <div className="text-xs text-slate-500">Link width ~ pair strength; node size ~ degree.</div>
            </div>

            {/* Consecutive runs */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Consecutive Runs (e.g., 12–13)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm">Total consecutive pairs: <b>{consecutive.totalPairs}</b></div>
                        <div className="mt-2 grid grid-cols-6 gap-1">
                            {Object.entries(consecutive.counts).slice(0, 60).map(([pair, c]) => (
                                <div key={pair} className="h-8 rounded text-xs flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
                                     style={{ backgroundColor: mapHeatColor(c / Math.max(1, consecutive.totalPairs), mode) }}
                                     title={`${pair}: ${c}`}>
                                    {pair}<span className="ml-1 text-slate-500">({c})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={Object.entries(consecutive.counts).map(([k, v]) => ({ pair: k, count: v }))}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="pair" interval={0} hide />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sum + rolling mean */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Sum of Main Numbers — Trend & Rolling Mean</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sums.map((s, i) => ({ date: s.date, sum: s.sum, mean50: mean50[i], mean100: mean100[i] }))}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="date" minTickGap={24} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sum" dot={false} />
                            <Line type="monotone" dataKey="mean50" dot={false} strokeOpacity={0.8} />
                            <Line type="monotone" dataKey="mean100" dot={false} strokeOpacity={0.6} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Range */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Range (max–min) — Histogram</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ranges.map((r) => ({ range: r.range }))}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="range" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Low/High split – stacked */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Low/High Split (1–25 vs 26–50)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lowHigh}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="date" hide />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="low" stackId="a" />
                            <Bar dataKey="high" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Parity split – donut */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Parity Split (Odd / Even)</h3>
                <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: "Odd", value: oddTotal },
                                    { name: "Even", value: evenTotal },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="55%"
                                outerRadius="80%"
                            >
                                <Cell />
                                <Cell />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Last digit */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Last-Digit Distribution (0–9)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lastDigit}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="digit" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Modulo classes */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Modulo Classes (mod 5, 7, 10)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[{ title: "mod 5", data: mod5, x: "r" }, { title: "mod 7", data: mod7, x: "r" }, { title: "mod 10", data: mod10, x: "r" }].map((g) => (
                        <div key={g.title} className="h-60">
                            <div className="text-sm font-medium mb-1">{g.title}</div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={g.data}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey={g.x} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </div>
            </div>

            {/* Position bias heatmap */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Number Position Bias (sorted positions)</h3>
                <div className="overflow-x-auto">
                    <div className="inline-grid" style={{ gridTemplateColumns: `repeat(${domainMax}, 14px)` }}>
                        {posBias.map((row, pos) =>
                            row.slice(1).map((t, idx) => {
                                const num = idx + 1;
                                return (
                                    <div
                                        key={`${pos}-${num}`}
                                        className="h-[14px] w-[14px] border border-white/10"
                                        style={{ backgroundColor: mapHeatColor(t, mode) }}
                                        title={`pos ${pos + 1} • #${num} : ${(t * 100).toFixed(1)}% of row max`}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">Rows are positions 1..5 (ascending sort) • each row normalized independently.</div>
            </div>

            {/* Weekday effect */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Weekday Effect (Tue vs Fri)</h3>
                <div className="flex items-center gap-2 text-sm">
                    <span>Significance: </span>
                    {weekday.badge === "likely" ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">likely</span>
                    ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">ns</span>
                    )}
                </div>
                <div className="h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekday.items}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="weekday" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Monthly seasonal */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Monthly / Seasonal Pattern</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Streaks: hot/cold run lengths */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Streaks — Hot/Cold Run Lengths</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[{ title: "Hot runs", arr: streaks.hotRuns }, { title: "Cold runs", arr: streaks.coldRuns }].map((g) => {
                        const hist = Object.entries(g.arr.reduce<Record<number, number>>((m, v) => (m[v] = (m[v] ?? 0) + 1, m), {}))
                            .map(([k, v]) => ({ len: Number(k), count: v }))
                            .sort((a, b) => a.len - b.len);
                        return (
                            <div key={g.title} className="h-64">
                                <div className="text-sm font-medium mb-1">{g.title}</div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hist}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="len" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Inter-arrival aggregate */}
            <div className="card p-4">
                <h3 className="font-semibold mb-2">Inter-Arrival Times — Aggregate Histogram</h3>
                <div className="h-64">
                    {(() => {
                        const gaps: Record<number, number> = {};
                        for (const arr of Object.values(interArrival)) for (const g of arr) gaps[g] = (gaps[g] ?? 0) + 1;
                        const data = Object.entries(gaps)
                            .map(([gap, count]) => ({ gap: Number(gap), count }))
                            .filter(d => d.gap <= 50)
                            .sort((a, b) => a.gap - b.gap);
                        return (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="gap" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" />
                                </BarChart>
                            </ResponsiveContainer>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
