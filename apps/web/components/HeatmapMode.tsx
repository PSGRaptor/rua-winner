"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type HeatmapMode = "Player" | "DataScientist";

type Ctx = {
    mode: HeatmapMode;
    setMode: (m: HeatmapMode) => void;
};

const HeatmapModeContext = createContext<Ctx | null>(null);
const KEY = "rua:heatmapMode";

/**
 * Local provider that persists the user's heatmap mode in localStorage.
 * This is a Client Component by design and does not affect SSR layout.
 */
export function HeatmapModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<HeatmapMode>("Player");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(KEY) as HeatmapMode | null;
            if (saved === "Player" || saved === "DataScientist") setMode(saved);
        } catch {
            /* ignore storage errors */
        }
    }, []);

    const api = useMemo<Ctx>(
        () => ({
            mode,
            setMode: (m) => {
                setMode(m);
                try {
                    localStorage.setItem(KEY, m);
                } catch {
                    /* ignore storage errors */
                }
            },
        }),
        [mode]
    );

    return <HeatmapModeContext.Provider value={api}>{children}</HeatmapModeContext.Provider>;
}

export function useHeatmapMode() {
    const ctx = useContext(HeatmapModeContext);
    if (!ctx) throw new Error("useHeatmapMode must be used within HeatmapModeProvider");
    return ctx;
}
