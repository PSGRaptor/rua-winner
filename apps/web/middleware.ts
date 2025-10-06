import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_ALLOWED = [
    "tauri://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
];

const ALLOWED_ORIGINS = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .concat(DEFAULT_ALLOWED);

function corsHeaders(origin: string | null) {
    const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
    return {
        "Access-Control-Allow-Origin": allow,
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
}

export function middleware(req: NextRequest) {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    // Preflight
    if (req.method === "OPTIONS") {
        return new NextResponse(null, { headers });
    }

    // Pass-through with CORS headers
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
    return res;
}

export const config = {
    matcher: ["/api/:path*"],
};
