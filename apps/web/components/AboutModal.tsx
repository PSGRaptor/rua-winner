"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect } from "react";

export type AboutModalProps = {
    open: boolean;
    onClose: () => void;
};

const APP_VERSION =
    process.env.NEXT_PUBLIC_APP_VERSION ??
    (typeof window !== "undefined" && (window as any).__APP_VERSION__) ??
    "v0.0.9";

export function AboutModal({ open, onClose }: AboutModalProps) {
    // Close on ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            aria-modal
            role="dialog"
            className="fixed inset-0 z-[1000] flex items-center justify-center"
        >
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* modal */}
            <div className="relative mx-4 w-full max-w-xl rounded-2xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start gap-3 border-b border-slate-200/70 p-4 dark:border-slate-700/60">
                    <div className="shrink-0 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                        {/* Uses /icon.ico in /public (see note below). Gracefully no-op if not present */}
                        {/* We keep width/height tiny so the ICO renders crisply */}
                        <Image
                            src="/icon.png"
                            alt="RUA Winner"
                            width={96}
                            height={96}
                            className="rounded"
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold"><br/>RUA Winner</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            All-in-one analysis suite to help you evaluate EuroJackpot data.
                        </p>
                    </div>
                    <button
                        aria-label="Close"
                        onClick={onClose}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <div className="card p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Author
                        </div>
                        <div className="mt-1">Badaxion</div>
                    </div>

                    <div className="card p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Last Update
                        </div>
                        <div className="mt-1">
                            {new Date().toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                            })}
                        </div>
                    </div>

                    <div className="card p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Version
                        </div>
                        <div className="mt-1">{APP_VERSION}</div>
                    </div>

                    <a
                        href="https://github.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="card p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            GitHub
                        </div>
                        <div className="mt-1 underline">Open repository</div>
                    </a>

                    <div className="sm:col-span-2 card p-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            RUA Winner helps you analyze and visualize EuroJackpot results
                            locally with a fast, elegant interface — designed for Windows,
                            with cross-platform support planned.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-200/70 p-3 dark:border-slate-700/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90 dark:bg-slate-200 dark:text-slate-900"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
