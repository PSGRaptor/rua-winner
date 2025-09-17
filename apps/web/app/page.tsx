"use client";

import { UpdateDataButton } from "../components/UpdateDataButton";
import { NumberEvaluator } from "../components/NumberEvaluator";
import { DataImporter } from "../components/DataImporter";
import { useData } from "../components/DataContext";
import { AnalyticsPreview } from "../components/AnalyticsPreview";

export default function Page() {
    const { version, draws, loadedFrom } = useData();

    return (
        <div className="grid gap-6 md:grid-cols-5">
            <section className="md:col-span-2 card p-5 space-y-4">
                <h2 className="text-lg font-semibold">Data</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Work locally first: import your EuroJackpot file (Excel/CSV).
                </p>
                <DataImporter />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                    Status: {draws.length ? (
                    <>Loaded <b>{draws.length}</b> rows (v{version ?? "n/a"}, source: {loadedFrom})</>
                ) : "No data loaded"}
                </div>
                <hr className="border-slate-200/60 dark:border-slate-700/60" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    (Later, the Update button below will sync from S3.)
                </p>
                <UpdateDataButton />
            </section>

            <section className="md:col-span-3 card p-5">
                <h2 className="text-lg font-semibold mb-3">Your Numbers — Evaluation</h2>
                <NumberEvaluator />
            </section>

            <section className="md:col-span-5 card p-5">
                <h2 className="text-lg font-semibold mb-3">Analytics</h2>
                <AnalyticsPreview />
            </section>
        </div>
    );
}
