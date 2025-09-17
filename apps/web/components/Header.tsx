"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
    return (
        <header className="sticky top-0 z-40 backdrop-blur bg-[rgb(var(--bg))]/80 border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.svg"
                        width={28}
                        height={28}
                        alt="RUA Winner"
                        priority
                    />
                    <span className="font-semibold text-lg tracking-tight">
            RUA Winner
          </span>
                    <span className="hidden md:inline text-sm text-slate-600 dark:text-slate-400">
            EuroJackpot Analysis
          </span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
