import type { Draw, PrizeClass } from "./index";

export type FreqPoint = { num: number; freq: number };
export type JackpotPoint = { date: string; jackpot: number };
export type PrizeStat = { cls: PrizeClass; count: number; total: number; avg: number };

export function computeMainFrequencies(draws: Draw[]): FreqPoint[] {
    const counts = new Array(51).fill(0); // 1..50
    for (const d of draws) {
        for (const n of d.z) {
            if (n >= 1 && n <= 50) counts[n]++;
        }
    }
    const out: FreqPoint[] = [];
    for (let n = 1; n <= 50; n++) out.push({ num: n, freq: counts[n] });
    return out;
}

export function computeEuroFrequencies(draws: Draw[]): FreqPoint[] {
    const counts = new Array(13).fill(0); // 1..12
    for (const d of draws) {
        for (const n of d.e) {
            if (n >= 1 && n <= 12) counts[n]++;
        }
    }
    const out: FreqPoint[] = [];
    for (let n = 1; n <= 12; n++) out.push({ num: n, freq: counts[n] });
    return out;
}

export function computeJackpotSeries(draws: Draw[]): JackpotPoint[] {
    // Use GKL1 as the jackpot payout for that draw (0 if missing)
    // Keep ascending by date
    const sorted = [...draws].sort((a, b) => a.drawDate.localeCompare(b.drawDate));
    return sorted.map((d) => ({ date: d.drawDate, jackpot: Number(d.gkl[1] ?? 0) || 0 }));
}

export function computePrizeStats(draws: Draw[]): PrizeStat[] {
    const counts: Record<PrizeClass, number> = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0};
    const totals: Record<PrizeClass, number> = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0};

    for (const d of draws) {
        for (let k = 1 as PrizeClass; k <= 12; k = (k + 1) as PrizeClass) {
            const v = d.gkl[k];
            if (typeof v === "number" && !Number.isNaN(v)) {
                counts[k] += 1;
                totals[k] += v;
            }
        }
    }
    const out: PrizeStat[] = [];
    for (let k = 1 as PrizeClass; k <= 12; k = (k + 1) as PrizeClass) {
        const c = counts[k];
        const t = totals[k];
        out.push({ cls: k, count: c, total: t, avg: c ? t / c : 0 });
    }
    return out;
}
