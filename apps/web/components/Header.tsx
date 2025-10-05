"use client";

import { useState } from "react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { Info } from "lucide-react";
import { AboutModal } from "./AboutModal";

export function Header() {
    const [showAbout, setShowAbout] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/70">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        {/* App icon in header */}
                        <Image
                            src="/icon.ico"
                            alt="RUA Winner"
                            width={32}
                            height={32}
                            className="rounded"
                            priority
                        />
                        <div className="leading-tight">
                            <div className="font-semibold">RUA Winner</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                EuroJackpot Analysis
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        <button
                            onClick={() => setShowAbout(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/80"
                            aria-label="About RUA Winner"
                            title="About RUA Winner"
                        >
                            <Info className="h-4 w-4" />
                            About
                        </button>
                    </div>
                </div>
            </header>

            <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
        </>
    );
}
