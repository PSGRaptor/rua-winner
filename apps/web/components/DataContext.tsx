"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Draw } from "@rua-winner/core";

type DataState = {
    draws: Draw[];
    setDraws: (d: Draw[]) => void;
    version: string | null;
    setVersion: (v: string | null) => void;
    loadedFrom: "local-file" | "sample" | "none" | "s3";
    setLoadedFrom: (s: DataState["loadedFrom"]) => void;
};

const DataContext = createContext<DataState | null>(null);

const LS_KEY = "rua-winner:draws";
const LS_VER = "rua-winner:version";
const LS_SRC = "rua-winner:loadedFrom";

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [version, setVersion] = useState<string | null>(null);
    const [loadedFrom, setLoadedFrom] = useState<DataState["loadedFrom"]>("none");

    // hydrate from localStorage once
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            const ver = localStorage.getItem(LS_VER);
            const src = (localStorage.getItem(LS_SRC) as DataState["loadedFrom"]) || "none";
            if (raw) {
                const parsed: Draw[] = JSON.parse(raw);
                setDraws(parsed);
                setVersion(ver);
                setLoadedFrom(src);
            }
        } catch {
            // ignore
        }
    }, []);

    // persist on change
    useEffect(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(draws));
            localStorage.setItem(LS_VER, version ?? "");
            localStorage.setItem(LS_SRC, loadedFrom);
        } catch {
            // ignore
        }
    }, [draws, version, loadedFrom]);

    const value = useMemo(
        () => ({ draws, setDraws, version, setVersion, loadedFrom, setLoadedFrom }),
        [draws, version, loadedFrom]
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useData must be used within DataProvider");
    return ctx;
}
