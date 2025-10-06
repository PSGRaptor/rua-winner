import { NextRequest, NextResponse } from "next/server";
import { ParquetReader } from "parquetjs-lite";

const IS_DESKTOP = process.env.NEXT_PUBLIC_DESKTOP === "1";

type PrizeClass = 1|2|3|4|5|6|7|8|9|10|11|12;
type Draw = {
    drawDate: string;
    z: [number, number, number, number, number];
    e: [number, number];
    gkl: Record<PrizeClass, number>;
};

function parseEuroLike(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v == null) return 0;
    let s = String(v).trim();
    if (!s) return 0;
    s = s.replace(/[€\s\u00A0\u202F]/g, "");
    if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
    else if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
    s = s.replace(/[^\d.\-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function toISODate(d: unknown): string {
    if (typeof d === "string") {
        const s = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
            const dd = m[1].padStart(2, "0");
            const mm = m[2].padStart(2, "0");
            return `${m[3]}-${mm}-${dd}`;
        }
        const dd = new Date(s);
        if (!Number.isNaN(+dd)) {
            const y = dd.getFullYear();
            const mo = String(dd.getMonth() + 1).padStart(2, "0");
            const d2 = String(dd.getDate()).padStart(2, "0");
            return `${y}-${mo}-${d2}`;
        }
    }
    if (typeof d === "number" && Number.isFinite(d)) {
        const base = new Date(Date.UTC(1899, 11, 30));
        const dt = new Date(base.getTime() + d * 86400000);
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dt.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
    return "";
}

function buildGkl(row: Record<string, any>): Record<PrizeClass, number> {
    const gj = row["gkl_json"] ?? row["GKL_JSON"] ?? row["GklJson"] ?? row["Gkl_JSON"];
    if (gj) {
        try {
            const parsed = typeof gj === "string" ? JSON.parse(gj) : gj;
            const out = {} as Record<PrizeClass, number>;
            for (let k = 1 as PrizeClass; k <= 12; k = (k + 1) as PrizeClass) {
                out[k] = parseEuroLike(parsed[String(k)]);
            }
            return out;
        } catch { /* fall through */ }
    }
    const out = {} as Record<PrizeClass, number>;
    for (let k = 1 as PrizeClass; k <= 12; k = (k + 1) as PrizeClass) {
        const variants = [
            `GKL${k}`, `GKL ${k}`, `GK${k}`, `GK ${k}`,
            `Gewinnklasse${k}`, `Gewinnklasse ${k}`,
            `gkl${k}`, `gkl ${k}`, `gk${k}`, `gk ${k}`,
        ];
        let val: any;
        for (const key of Object.keys(row)) {
            if (variants.some(v => v.toLowerCase() === key.toLowerCase())) {
                val = row[key];
                break;
            }
        }
        out[k] = parseEuroLike(val);
    }
    return out;
}

function rowToDraw(row: Record<string, any>): Draw {
    const drawDate =
        toISODate(row.drawDate ?? row.Datum ?? row.date ?? row["Draw Date"] ?? row["draw_date"]);

    const pickInt = (name: string) => {
        const v = row[name] ?? row[name.toUpperCase()] ?? row[name.toLowerCase()];
        const n = parseEuroLike(v);
        return Math.max(0, Math.round(n));
    };

    const z = [
        pickInt("z1") || pickInt("Z1"),
        pickInt("z2") || pickInt("Z2"),
        pickInt("z3") || pickInt("Z3"),
        pickInt("z4") || pickInt("Z4"),
        pickInt("z5") || pickInt("Z5"),
    ].map(n => Math.min(Math.max(n, 1), 50)) as [number, number, number, number, number];

    const e = [
        pickInt("e1") || pickInt("E1"),
        pickInt("e2") || pickInt("E2"),
    ].map(n => Math.min(Math.max(n, 1), 12)) as [number, number];

    const gkl = buildGkl(row);

    return { drawDate, z, e, gkl };
}

function isValidDraw(d: Draw): boolean {
    return Boolean(
        d.drawDate &&
        d.z.length === 5 &&
        d.e.length === 2 &&
        d.z.every(n => Number.isFinite(n)) &&
        d.e.every(n => Number.isFinite(n))
    );
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "No file" }, { status: 400 });
        }
        const buf = Buffer.from(await file.arrayBuffer());

        const reader = await ParquetReader.openBuffer(buf);
        const cursor = await reader.getCursor();
        const rows: any[] = [];
        for (let row = await cursor.next(); row; row = await cursor.next()) {
            rows.push(row);
        }
        await reader.close();

        const draws = rows.map(rowToDraw).filter(isValidDraw);
        draws.sort((a, b) => a.drawDate.localeCompare(b.drawDate));

        return NextResponse.json({ draws, count: draws.length }, { status: 200 });
    } catch (e: any) {
        console.error("parse-parquet error:", e);
        return NextResponse.json({ error: e?.message || "Failed to parse parquet" }, { status: 500 });
    }
}
