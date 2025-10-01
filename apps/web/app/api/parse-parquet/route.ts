// app/api/parse-parquet/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (parquetjs-lite needs Node)

type Draw = {
    drawDate: string;
    z: number[];
    e: number[];
    gkl?: number;
};

// POST: multipart/form-data with "file": <.parquet>
export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Lazy import to keep cold start lean
    const parquet = await import("parquetjs-lite");
    const reader = await parquet.ParquetReader.openBuffer(buf);
    const cursor = reader.getCursor();

    const out: Draw[] = [];
    for (let rec = (await cursor.next()) as any; rec; rec = await cursor.next()) {
        // Accept either normalized (drawDate, z1..z5, e1..e2, gkl)
        // or raw headers (Datum, Z1..Z5, E1..E2, GKL1)
        const drawDate = (rec.drawDate ?? rec.Datum ?? rec.date)?.toString();

        const z = [
            rec.z1 ?? rec.Z1,
            rec.z2 ?? rec.Z2,
            rec.z3 ?? rec.Z3,
            rec.z4 ?? rec.Z4,
            rec.z5 ?? rec.Z5,
        ]
            .map((n: any) => (n == null ? null : Number(n)))
            .filter((n: number | null): n is number => n != null);

        const e = [rec.e1 ?? rec.E1, rec.e2 ?? rec.E2]
            .filter((x: any) => x != null)
            .map((x: any) => Number(x));

        const gklRaw = rec.gkl ?? rec.GKL1;
        const gkl = gklRaw != null ? Number(gklRaw) : undefined;

        if (drawDate && z.length === 5 && e.length >= 1) {
            out.push({ drawDate, z, e, gkl });
        }
    }

    await reader.close();
    return NextResponse.json({ draws: out });
}
