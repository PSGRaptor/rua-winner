"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type VizFlags = {
    // Base
    topMain: boolean;
    euroNumbers: boolean;
    heatmaps: boolean;
    prizeClass: boolean;
    overdueChart: boolean;
    jackpotHistory: boolean;

    // Advanced
    overdueTable: boolean;
    pairsMatrix: boolean;
    tripletsTable: boolean;
    cooccurNet: boolean;
    consecutive: boolean;
    sumTrend: boolean;
    rangeHist: boolean;
    lowHigh: boolean;
    parity: boolean;
    lastDigit: boolean;
    modulo: boolean;
    posBias: boolean;
    weekdayEffect: boolean;
    monthlySeasonal: boolean;
    streaks: boolean;
    interArrival: boolean;
};

const DEFAULT_FLAGS: VizFlags = {
    topMain: true,
    euroNumbers: true,
    heatmaps: true,
    prizeClass: true,
    overdueChart: true,
    jackpotHistory: true,
    overdueTable: true,
    pairsMatrix: true,
    tripletsTable: true,
    cooccurNet: true,
    consecutive: true,
    sumTrend: true,
    rangeHist: true,
    lowHigh: true,
    parity: true,
    lastDigit: true,
    modulo: true,
    posBias: true,
    weekdayEffect: true,
    monthlySeasonal: true,
    streaks: true,
    interArrival: true,
};

type Ctx = {
    flags: VizFlags;
    setFlag: <K extends keyof VizFlags>(key: K, value: boolean) => void;
    reset: () => void;
};

const AnalyticsSettingsContext = createContext<Ctx | null>(null);
const KEY = "rua:vizFlags";

export function AnalyticsSettingsProvider({ children }: { children: React.ReactNode }) {
    const [flags, setFlags] = useState<VizFlags>(DEFAULT_FLAGS);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setFlags({ ...DEFAULT_FLAGS, ...JSON.parse(raw) });
        } catch {/* ignore */}
    }, []);

    const api = useMemo<Ctx>(() => ({
        flags,
        setFlag: (key, value) => {
            setFlags(prev => {
                const next = { ...prev, [key]: value };
                try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {/* ignore */}
                return next;
            });
        },
        reset: () => {
            setFlags(DEFAULT_FLAGS);
            try { localStorage.setItem(KEY, JSON.stringify(DEFAULT_FLAGS)); } catch {/* ignore */}
        },
    }), [flags]);

    return (
        <AnalyticsSettingsContext.Provider value={api}>
            {children}
        </AnalyticsSettingsContext.Provider>
    );
}

export function useAnalyticsSettings() {
    const ctx = useContext(AnalyticsSettingsContext);
    if (!ctx) throw new Error("useAnalyticsSettings must be used within AnalyticsSettingsProvider");
    return ctx;
}
