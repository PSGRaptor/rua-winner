// START OF FILE: apps/web/src/components/NumberEvaluator.tsx
"use client";

import { useMemo, useState } from "react";
import {
    evaluateNumbers,
    type Draw,
    ALL_CLASSES,
    type PrizeClass,
} from "@rua-winner/core";
import { Check } from "lucide-react";
import { useData } from "./DataContext";

/**
 * Shared EUR formatter: app deals in Euros only.
 * Using de-DE for typical Euro formatting (e.g., 1.234,56 €)
 * If you prefer a different locale, adjust here globally.
 */
const EUR = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
});

// Fallback sample to demonstrate UI when no data imported yet
const SAMPLE_DRAWS: Draw[] = [
    {
        drawDate: "2025-09-12",
        z: [7, 22, 24, 33, 45],
        e: [4, 12],
        gkl: {
            1: 116_000_000,
            2: 560_209.9,
            3: 90_266.3,
            4: 5_390.9,
            5: 235.5,
            6: 190.4,
            7: 78.6,
            8: 31.1,
            9: 18.9,
            10: 15.2,
            11: 15.2,
            12: 10.0,
        },
    },
    {
        drawDate: "2025-09-05",
        z: [6, 14, 25, 29, 46],
        e: [7, 11],
        gkl: {
            1: 86_000_000,
            2: 2_554_784.5,
            3: 144_077.9,
            4: 4_753.0,
            5: 314.3,
            6: 189.7,
            7: 109.3,
            8: 31.0,
            9: 21.1,
            10: 16.6,
            11: 15.6,
            12: 10.5,
        },
    },
];

function clampArray(initial: number[], min: number, max: number, size: number) {
    return initial.slice(0, size).map((n) => Math.min(Math.max(n, min), max)) as any;
}

export function NumberEvaluator() {
    const { draws } = useData();
    const sourceDraws = draws.length ? draws : SAMPLE_DRAWS;

    const [main, setMain] = useState<[number, number, number, number, number]>([
        1, 2, 3, 4, 5,
    ]);
    const [euro, setEuro] = useState<[number, number]>([1, 2]);

    const result = useMemo(() => {
        // Ensure de-duplicated inputs
        const mainSet = Array.from(new Set(main)).slice(0, 5) as [
            number,
            number,
            number,
            number,
            number
        ];
        const euroSet = Array.from(new Set(euro)).slice(0, 2) as [number, number];

        return evaluateNumbers(sourceDraws, mainSet, euroSet);
    }, [main, euro, sourceDraws]);

    return (
        <div className="space-y-4">
            {!draws.length && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    No data imported yet — showing a small sample for demo. Import your dataset in
                    the left panel to evaluate against full history.
                </div>
            )}

            <div className="grid grid-cols-7 gap-2">
                {main.map((n, i) => (
                    <input
                        key={`m${i}`}
                        type="number"
                        className="card px-3 py-2"
                        min={1}
                        max={50}
                        value={n}
                        onChange={(e) => {
                            const next = [...main] as [number, number, number, number, number];
                            next[i] = parseInt(e.target.value || "0", 10);
                            setMain(clampArray(next, 1, 50, 5));
                        }}
                    />
                ))}
                {euro.map((n, i) => (
                    <input
                        key={`e${i}`}
                        type="number"
                        className="card px-3 py-2"
                        min={1}
                        max={12}
                        value={n}
                        onChange={(e) => {
                            const next = [...euro] as [number, number];
                            next[i] = parseInt(e.target.value || "0", 10);
                            setEuro(clampArray(next, 1, 12, 2));
                        }}
                    />
                ))}
            </div>

            <button
                className="btn btn-primary"
                onClick={() => {
                    /* evaluation is reactive in useMemo */
                }}
            >
                <Check className="w-4 h-4" />
                Evaluate
            </button>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left">
                        <th className="p-2">Class</th>
                        <th className="p-2">Hits</th>
                        <th className="p-2">Total (€)</th>
                        <th className="p-2">Avg (€)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ALL_CLASSES.map((k: PrizeClass) => {
                        const hits = result.classHits[k] ?? 0;
                        const total = result.classTotals[k] ?? 0;
                        const avg = hits ? total / hits : 0;
                        return (
                            <tr
                                key={k}
                                className="border-t border-slate-200/60 dark:border-slate-700/60"
                            >
                                <td className="p-2 font-medium">GKL{k}</td>
                                <td className="p-2">{hits}</td>
                                <td className="p-2">{EUR.format(total)}</td>
                                <td className="p-2">{EUR.format(avg)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                    <tfoot>
                    <tr className="border-t border-slate-200/60 dark:border-slate-700/60">
                        <td className="p-2 font-semibold">Total</td>
                        <td className="p-2"></td>
                        <td className="p-2 font-semibold">{EUR.format(result.grandTotal ?? 0)}</td>
                        <td className="p-2"></td>
                    </tr>
                    </tfoot>
                </table>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400">
                Best class hit: {result.bestClass ? `GKL${result.bestClass}` : "—"}
            </div>
        </div>
    );
}
// END OF FILE: apps/web/src/components/NumberEvaluator.tsx
