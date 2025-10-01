"use client";

import React, { useMemo, useState } from "react";
import type { Draw } from "@rua-winner/core";
import { Sparkles, Copy, RefreshCcw } from "lucide-react";

/**
 * SmartPicks
 * Creates 5 data-informed EuroJackpot sets (5 mains, 2 euros) from your local dataset.
 * It does NOT claim prediction; it scores/samples combinations using:
 *  - frequency + recency-decay weights,
 *  - mild pair (co-occurrence) lift bonuses,
 *  - shape heuristics (spread, gaps, parity, last-digit diversity, sum band),
 *  - mild penalties for "popular human" patterns (birthdays, runs, repeated endings).
 *
 * Inputs:
 *  - draws: Draw[] where draw.z = [m1..m5], draw.e = [e1..e2], draw.drawDate = "YYYY-MM-DD"
 *
 * Output:
 *  - A card rendering 5 suggested sets + badges explaining why each scored well.
 */

type Ticket = {
    mains: number[];
    euros: number[];
    score: number;
    badges: string[];
};

const MAIN_MAX = 50;
const EURO_MAX = 12;

function getMains(d: Draw) {
    const anyd = d as any;
    return Array.isArray(anyd.z) ? (anyd.z as number[]) : [];
}
function getEuros(d: Draw) {
    const anyd = d as any;
    return Array.isArray(anyd.e) ? (anyd.e as number[]) : [];
}

function clamp(x: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, x));
}

function zscore(arr: number[]) {
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b, 0) / Math.max(1, n);
    const sd = Math.sqrt(
        arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / Math.max(1, n)
    ) || 1;
    return arr.map((v) => (v - mean) / sd);
}

/** Frequency counts over all draws */
function countFreq(draws: Draw[], domainMax: number, accessor: (d: Draw) => number[]) {
    const cnt = new Array(domainMax + 1).fill(0);
    for (const d of draws) for (const n of accessor(d)) if (n >= 1 && n <= domainMax) cnt[n]++;
    return cnt;
}

/** Recency-decayed counts; newer draws weigh more. */
function recencyWeights(
    draws: Draw[],
    domainMax: number,
    accessor: (d: Draw) => number[],
    decayPerDraw = 0.995
) {
    // Weight at index t (0..N-1) = decay^(N-1 - t)
    const N = draws.length;
    const w = new Array(domainMax + 1).fill(0);
    for (let t = 0; t < N; t++) {
        const weight = Math.pow(decayPerDraw, N - 1 - t);
        for (const n of accessor(draws[t])) if (n >= 1 && n <= domainMax) w[n] += weight;
    }
    return w;
}

/** Pair co-occurrence counts (mains only) */
function pairMatrix(draws: Draw[], domainMax = MAIN_MAX) {
    const mat: number[][] = Array.from({ length: domainMax + 1 }, () => new Array(domainMax + 1).fill(0));
    const seen: number[] = new Array(domainMax + 1).fill(0);
    for (const d of draws) {
        const ms = Array.from(new Set(getMains(d))).sort((a, b) => a - b);
        for (const m of ms) seen[m]++;
        for (let i = 0; i < ms.length; i++) {
            for (let j = i + 1; j < ms.length; j++) {
                const a = ms[i], b = ms[j];
                mat[a][b]++; mat[b][a]++;
            }
        }
    }
    return { mat, seen };
}

/** Lift(a,b) = P(a,b) / (P(a)P(b)); computed over mains */
function makeLift(draws: Draw[], domainMax = MAIN_MAX) {
    const N = Math.max(1, draws.length);
    const { mat, seen } = pairMatrix(draws, domainMax);
    const Pa = seen.map((c) => c / N);
    return (a: number, b: number) => {
        if (a === b) return 0;
        const pab = mat[a][b] / N;
        const denom = Math.max(1e-9, (Pa[a] || 0) * (Pa[b] || 0));
        return pab / denom;
    };
}

/** Weighted sampling without replacement (Efraimidis–Spirakis) */
function sampleK(domainMax: number, k: number, w: number[], rng: () => number) {
    const keys: { i: number; key: number }[] = [];
    for (let i = 1; i <= domainMax; i++) {
        const wi = Math.max(1e-9, w[i]);
        const u = Math.max(1e-12, rng());
        const key = Math.pow(u, 1.0 / wi); // higher weight -> larger key (select top-k)
        keys.push({ i, key });
    }
    keys.sort((a, b) => b.key - a.key);
    return keys.slice(0, k).map((x) => x.i).sort((a, b) => a - b);
}

function distinctCount<T>(arr: T[]) {
    return new Set(arr).size;
}

function scoreTicket(
    mains: number[],
    euros: number[],
    wMain: number[],
    wEuro: number[],
    lift: (a: number, b: number) => number,
    sumBand: { lo: number; hi: number }
) {
    const badges: string[] = [];
    let s =
        mains.reduce((acc, m) => acc + Math.log(Math.max(1e-9, wMain[m])), 0) +
        euros.reduce((acc, e) => acc + Math.log(Math.max(1e-9, wEuro[e])), 0);

    // Pair bonuses (mains)
    for (let i = 0; i < mains.length; i++) {
        for (let j = i + 1; j < mains.length; j++) {
            const L = lift(mains[i], mains[j]);
            if (L > 1) s += 0.5 * Math.min(2.0, L - 1.0);
        }
    }

    const min = mains[0], max = mains[mains.length - 1];
    const avgGap = (max - min) / 4;
    const odd = mains.filter((x) => x % 2 === 1).length;
    const lastDigitDistinct = distinctCount(mains.map((v) => v % 10));
    const sum = mains.reduce((a, b) => a + b, 0);

    if (min <= 10 && max >= 40) { s += 1.0; badges.push("wide spread"); }
    if (avgGap >= 7) { s += 1.0; badges.push("good spacing"); }
    if (odd === 2 || odd === 3) { s += 0.5; badges.push("odd/even balance"); }
    if (lastDigitDistinct >= 4) { s += 0.5; badges.push("digit diversity"); }
    if (sum >= sumBand.lo && sum <= sumBand.hi) { s += 0.5; badges.push("sum in band"); }

    // Popularity penalties (avoid shared jackpots)
    if (mains.every((v) => v <= 31)) { s -= 1.5; badges.push("avoids birthdays"); }
    let run = 1, maxRun = 1;
    for (let i = 1; i < mains.length; i++) {
        run = mains[i] === mains[i - 1] + 1 ? run + 1 : 1;
        if (run > maxRun) maxRun = run;
    }
    if (maxRun >= 3) { s -= 1.0; badges.push("avoids long runs"); }
    const maxSameEnding = Math.max(...Object.values(mains.reduce<Record<number, number>>((m, v) => {
        m[v % 10] = (m[v % 10] || 0) + 1; return m;
    }, {})));
    if (maxSameEnding >= 3) { s -= 0.75; badges.push("avoids same endings"); }

    return { score: s, badges };
}

/** Greedy diversity selector: maximize minimum distance across picks */
function selectDiverse(pool: Ticket[], want = 5) {
    const dist = (a: Ticket, b: Ticket) => {
        const interM = a.mains.filter((v) => b.mains.includes(v)).length;
        const interE = a.euros.filter((v) => b.euros.includes(v)).length;
        return (5 - interM) + (2 - interE);
    };
    const picks: Ticket[] = [];
    for (const cand of pool) {
        if (picks.length === 0 || picks.every((p) => dist(p, cand) >= 5)) {
            picks.push(cand);
            if (picks.length === want) break;
        }
    }
    while (picks.length < want && picks.length < pool.length) picks.push(pool[picks.length]);
    return picks;
}

function computeSumBand(draws: Draw[]) {
    // middle 60% of historical sums (mains)
    const sums = draws.map((d) => getMains(d).reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
    if (!sums.length) return { lo: 95, hi: 185 }; // fallback
    const p20 = sums[Math.floor(0.20 * (sums.length - 1))];
    const p80 = sums[Math.floor(0.80 * (sums.length - 1))];
    return { lo: p20, hi: p80 };
}

export function SmartPicks({ draws }: { draws: Draw[] }) {
    const [seed, setSeed] = useState<number>(() => Date.now() & 0xffff);

    const rng = useMemo(() => {
        // simple LCG based on seed
        let st = (seed >>> 0) || 1;
        return () => ((st = (1664525 * st + 1013904223) >>> 0) / 2 ** 32);
    }, [seed]);

    const data = useMemo(() => {
        if (!draws.length) return [] as Ticket[];

        // Base stats
        const freqM = countFreq(draws, MAIN_MAX, getMains);
        const freqE = countFreq(draws, EURO_MAX, getEuros);
        const recM = recencyWeights(draws, MAIN_MAX, getMains, 0.995);
        const recE = recencyWeights(draws, EURO_MAX, getEuros, 0.995);

        // zscore recency and combine with Laplace smoothing
        const zRecM = zscore(recM.slice(1)); // ignore index 0
        const zRecE = zscore(recE.slice(1));
        const alpha = 1.0, beta = 0.35;

        const wMain: number[] = new Array(MAIN_MAX + 1).fill(0);
        const wEuro: number[] = new Array(EURO_MAX + 1).fill(0);
        for (let i = 1; i <= MAIN_MAX; i++) {
            wMain[i] = (freqM[i] + alpha) * (1 + beta * zRecM[i - 1]);
        }
        for (let i = 1; i <= EURO_MAX; i++) {
            wEuro[i] = (freqE[i] + alpha) * (1 + beta * zRecE[i - 1]);
        }

        const lift = makeLift(draws, MAIN_MAX);
        const sumBand = computeSumBand(draws);

        // Sample + score
        const samples = clamp(2000, 500, 6000); // keep UI responsive
        const pool: Ticket[] = [];
        for (let t = 0; t < samples; t++) {
            const mains = sampleK(MAIN_MAX, 5, wMain, rng);
            const euros = sampleK(EURO_MAX, 2, wEuro, rng);
            const { score, badges } = scoreTicket(mains, euros, wMain, wEuro, lift, sumBand);
            pool.push({ mains, euros, score, badges });
        }

        // Keep top K, then diversify
        const top = pool.sort((a, b) => b.score - a.score).slice(0, 200);
        const picks = selectDiverse(top, 5).sort((a, b) => b.score - a.score);
        return picks;
    }, [draws, rng]);

    if (!draws.length) return null;

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold">Smart Picks (Data-Informed)</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <em>Not predictions — diverse, data-guided suggestions.</em>
                    <button
                        className="btn btn-ghost px-2 py-1"
                        onClick={() => setSeed((s) => (s + 1) & 0xffff)}
                        title="Re-sample with a new seed"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reroll
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-xs text-slate-500">
                    <tr>
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">Mains (5)</th>
                        <th className="px-2 py-1 text-left">Euros (2)</th>
                        <th className="px-2 py-1 text-left">Why this set</th>
                        <th className="px-2 py-1 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((t, idx) => {
                        const mains = t.mains.join(" ");
                        const euros = t.euros.join(" ");
                        const clip = `M: ${mains}  |  E: ${euros}`;
                        return (
                            <tr key={idx} className="border-t border-slate-200/60 dark:border-slate-700/60">
                                <td className="px-2 py-2 align-top w-10">{idx + 1}</td>
                                <td className="px-2 py-2 align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {t.mains.map((n) => (
                                            <span key={n} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">{n}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {t.euros.map((n) => (
                                            <span key={n} className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          {n}
                        </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {t.badges.slice(0, 4).map((b, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                          {b}
                        </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-2 align-top">
                                    <button
                                        className="btn btn-ghost px-2 py-1 text-xs"
                                        onClick={() => navigator.clipboard?.writeText(clip)}
                                        title="Copy this set"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                These combinations are sampled by frequency/recency weights and nudged by mild pair-lift & shape heuristics, then diversified.
            </div>
        </div>
    );
}
