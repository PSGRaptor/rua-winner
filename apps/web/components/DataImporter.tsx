"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useData } from "./DataContext";
import type { Draw, PrizeClass } from "@rua-winner/core";
import { Upload } from "lucide-react";

// Expected columns (case-insensitive) for XLSX/CSV:
// Datum (date), Z1..Z5, E1, E2, GKL1..GKL12
type RawRow = Record<string, any>;

function toISODate(v: any): string {
    // Accept "DD.MM.YYYY", Excel dates, or ISO strings
    if (typeof v === "number") {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(v);
        const date = new Date(Date.UTC(d.y, d.m - 1, d.d));
        return date.toISOString().slice(0, 10);
    }
    if (typeof v === "string") {
        const s = v.trim();
        // DD.MM.YYYY
        const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (m) {
            const [_, dd, mm, yyyy] = m;
            return `${yyyy}-${mm}-${dd}`;
        }
        // ISO-ish
        if (!Number.isNaN(Date.parse(s))) {
            return new Date(s).toISOString().slice(0, 10);
        }
    }
    throw new Error(`Unrecognized date: ${String(v)}`);
}

function parseRows(rows: RawRow[]): Draw[] {
    const norm = (k: string) => k.toLowerCase().trim();

    // Build column index by normalized name
    const first = rows[0] || {};
    const keys = Object.keys(first);

    // helper to find a key among variants
    const findKey = (variants: string[]) => {
        const idx = keys.find((k) => variants.includes(norm(k)));
        return idx ?? null;
    };

    const col = {
        date: findKey(["datum", "date", "drawdate", "draw_date"]),
        z: [
            findKey(["z1", "m1", "n1"]),
            findKey(["z2", "m2", "n2"]),
            findKey(["z3", "m3", "n3"]),
            findKey(["z4", "m4", "n4"]),
            findKey(["z5", "m5", "n5"]),
        ],
        e: [findKey(["e1", "zz1", "euro1"]), findKey(["e2", "zz2", "euro2"])],
        g: [
            findKey(["gkl1", "class1", "g1"]),
            findKey(["gkl2", "class2", "g2"]),
            findKey(["gkl3", "class3", "g3"]),
            findKey(["gkl4", "class4", "g4"]),
            findKey(["gkl5", "class5", "g5"]),
            findKey(["gkl6", "class6", "g6"]),
            findKey(["gkl7", "class7", "g7"]),
            findKey(["gkl8", "class8", "g8"]),
            findKey(["gkl9", "class9", "g9"]),
            findKey(["gkl10", "class10", "g10"]),
            findKey(["gkl11", "class11", "g11"]),
            findKey(["gkl12", "class12", "g12"]),
        ],
    };

    if (!col.date) throw new Error("Missing date column (Datum/Date/DrawDate).");
    if (col.z.some((k) => !k)) throw new Error("Missing one or more Z1..Z5 columns.");
    if (col.e.some((k) => !k)) throw new Error("Missing Euro columns (E1,E2).");

    const draws: Draw[] = [];

    for (const r of rows) {
        const drawDate = toISODate(r[col.date as string]);

        const z = [
            Number(r[col.z[0] as string]),
            Number(r[col.z[1] as string]),
            Number(r[col.z[2] as string]),
            Number(r[col.z[3] as string]),
            Number(r[col.z[4] as string]),
        ] as [number, number, number, number, number];

        const e = [Number(r[col.e[0] as string]), Number(r[col.e[1] as string])] as [number, number];

        const gkl: Partial<Record<PrizeClass, number>> = {};
        for (let i = 0; i < 12; i++) {
            const key = col.g[i];
            if (key && r[key] != null && r[key] !== "") {
                const klass = (i + 1) as PrizeClass;
                const val =
                    typeof r[key] === "string"
                        ? Number(String(r[key]).replace(/[^\d.,-]/g, "").replace(",", "."))
                        : Number(r[key]);
                if (!Number.isNaN(val)) gkl[klass] = val;
            }
        }

        // basic validation
        if (z.some((n) => !Number.isFinite(n) || n < 1 || n > 50)) {
            throw new Error(`Invalid main numbers at ${drawDate}`);
        }
        if (e.some((n) => !Number.isFinite(n) || n < 1 || n > 12)) {
            throw new Error(`Invalid euro numbers at ${drawDate}`);
        }

        draws.push({ drawDate, z, e, gkl });
    }

    // sort by date ascending
    draws.sort((a, b) => a.drawDate.localeCompare(b.drawDate));
    return draws;
}

export function DataImporter() {
    const { setDraws, setVersion, setLoadedFrom, version, draws } = useData();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [status, setStatus] = useState<"idle" | "reading" | "parsed" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<{ min: string; max: string; rows: number } | null>(null);

    async function parseParquetOnServer(file: File) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/parse-parquet", { method: "POST", body: fd });
        if (!res.ok) {
            const msg = await res.text().catch(() => res.statusText);
            throw new Error(`Parquet parse failed: ${msg}`);
        }
        const { draws } = (await res.json()) as { draws: Draw[] };
        return draws;
    }

    const handleFile = async (file: File) => {
        try {
            setStatus("reading");
            setError(null);

            const lower = file.name.toLowerCase();

            // --- NEW: local parquet path (server parses and normalizes) ---
            if (lower.endsWith(".parquet")) {
                const parsed = await parseParquetOnServer(file);
                const min = parsed[0]?.drawDate ?? "";
                const max = parsed[parsed.length - 1]?.drawDate ?? "";

                setDraws(parsed);
                setVersion(max || new Date().toISOString().slice(0, 10));
                setLoadedFrom("local-file");
                setSummary({ min, max, rows: parsed.length });
                setStatus("parsed");
                return;
            }

            // --- Existing XLSX/XLS/CSV path (unchanged) ---
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheetName = wb.SheetNames[0];
            const ws = wb.Sheets[sheetName];
            const rows: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

            const parsed = parseRows(rows);
            const min = parsed[0]?.drawDate ?? "";
            const max = parsed[parsed.length - 1]?.drawDate ?? "";

            setDraws(parsed);
            setVersion(max || new Date().toISOString().slice(0, 10));
            setLoadedFrom("local-file");
            setSummary({ min, max, rows: parsed.length });
            setStatus("parsed");
        } catch (e: any) {
            setStatus("error");
            setError(e?.message ?? "Failed to read file");
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <button
                    className="btn btn-primary"
                    onClick={() => inputRef.current?.click()}
                    title="Import EuroJackpot data from a local .parquet, .xlsx or .csv file"
                >
                    <Upload className="w-4 h-4" />
                    Import local data
                </button>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    {status === "idle" &&
                        (draws.length ? (
                            <>
                                Loaded <b>{draws.length}</b> rows (v{version}) from local storage.
                            </>
                        ) : (
                            <>No data loaded yet. Import a .parquet, .xlsx or .csv.</>
                        ))}
                    {status === "reading" && "Reading file…"}
                    {status === "parsed" && summary && (
                        <>
                            Imported <b>{summary.rows}</b> rows • {summary.min} → {summary.max} (v{version})
                        </>
                    )}
                    {status === "error" && <span className="text-red-600">Error: {error}</span>}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".parquet,.xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.currentTarget.value = ""; // allow re-selecting same file
                }}
            />
        </div>
    );
}
