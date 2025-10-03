export type PrizeClass = 1|2|3|4|5|6|7|8|9|10|11|12;
export const ALL_CLASSES: PrizeClass[] = [1,2,3,4,5,6,7,8,9,10,11,12];

export type Draw = {
    drawDate: string;
    z: [number, number, number, number, number];
    e: [number, number];
    gkl: Partial<Record<PrizeClass, number>>;
};

export type EvaluationResult = {
    classHits: Partial<Record<PrizeClass, number>>;
    classTotals: Partial<Record<PrizeClass, number>>;
    grandTotal: number;
    bestClass: PrizeClass | null;
    wins: Array<{ date: string; class: PrizeClass; amount: number }>;
};

export function mapMatchToClass(mainMatches: number, euroMatches: number): PrizeClass | null {
    if (mainMatches === 5 && euroMatches === 2) return 1;
    if (mainMatches === 5 && euroMatches === 1) return 2;
    if (mainMatches === 5 && euroMatches === 0) return 3;
    if (mainMatches === 4 && euroMatches === 2) return 4;
    if (mainMatches === 4 && euroMatches === 1) return 5;
    if (mainMatches === 4 && euroMatches === 0) return 6;
    if (mainMatches === 3 && euroMatches === 2) return 7;
    if (mainMatches === 2 && euroMatches === 2) return 8;
    if (mainMatches === 3 && euroMatches === 1) return 9;
    if (mainMatches === 3 && euroMatches === 0) return 10;
    if (mainMatches === 1 && euroMatches === 2) return 11;
    if (mainMatches === 2 && euroMatches === 1) return 12;
    return null;
}

export function evaluateNumbers(
    draws: Draw[],
    userMain: [number, number, number, number, number],
    userEuro: [number, number]
) {
    const mainSet = new Set(userMain);
    const euroSet = new Set(userEuro);

    const classHits: Partial<Record<PrizeClass, number>> = {};
    const classTotals: Partial<Record<PrizeClass, number>> = {};
    const wins: Array<{ date: string; class: PrizeClass; amount: number }> = [];

    let grandTotal = 0;
    let bestClass: PrizeClass | null = null;

    for (const d of draws) {
        let mainMatches = 0;
        for (const n of d.z) if (mainSet.has(n)) mainMatches++;
        let euroMatches = 0;
        for (const n of d.e) if (euroSet.has(n)) euroMatches++;

        const klass = mapMatchToClass(mainMatches, euroMatches);
        if (klass !== null) {
            const payout = d.gkl[klass] ?? 0;
            classHits[klass] = (classHits[klass] ?? 0) + 1;
            classTotals[klass] = (classTotals[klass] ?? 0) + payout;
            grandTotal += payout;
            wins.push({ date: d.drawDate, class: klass, amount: payout });
            if (bestClass === null || klass < bestClass) bestClass = klass;
        }
    }

    return { classHits, classTotals, grandTotal, bestClass, wins };
}

// Re-export analytics & heatmap helpers for consumers
export * from "./analytics";
export * from "./heatmap";
