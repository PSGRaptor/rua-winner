"use client";

import { useState } from "react";
import { CloudDownload } from "lucide-react";

/**
 * First pass: stub action. In Sprint 1.5 we'll wire it to:
 *  1) fetch manifest.json from CloudFront
 *  2) compare version
 *  3) fetch dataset (CSV/Parquet), verify SHA256
 *  4) import into client SQLite (sql.js)
 */
export function UpdateDataButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
    const [version, setVersion] = useState<string | null>(null);

    const handleUpdate = async () => {
        try {
            setStatus("loading");
            // TODO: replace with real manifest URL/proxy
            await new Promise((r) => setTimeout(r, 900));
            setVersion("2025-09-16");
            setStatus("ok");
        } catch {
            setStatus("err");
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button className="btn btn-primary" onClick={handleUpdate}>
                <CloudDownload className="w-4 h-4" />
                Update data
            </button>
            <div className="text-sm text-slate-600 dark:text-slate-400">
                {status === "idle" && "Dataset not checked yet."}
                {status === "loading" && "Checking and downloading…"}
                {status === "ok" && (
                    <span>
            Updated to <span className="font-semibold">v{version}</span>.
          </span>
                )}
                {status === "err" && "Update failed. Please try again."}
            </div>
        </div>
    );
}
