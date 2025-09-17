"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const current = theme === "system" ? systemTheme : theme;
    const isDark = current === "dark";

    if (!mounted) return (
        <button className="btn btn-ghost" aria-label="Toggle theme">
            <Sun className="w-4 h-4" />
        </button>
    );

    return (
        <button
            className="btn btn-ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>
    );
}
