"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { DataProvider } from "./DataContext";
import { HeatmapModeProvider } from "./HeatmapMode";
import { AnalyticsSettingsProvider } from "./AnalyticsSettings";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <DataProvider>
                <HeatmapModeProvider>
                    <AnalyticsSettingsProvider>
                        {children}
                    </AnalyticsSettingsProvider>
                </HeatmapModeProvider>
            </DataProvider>
        </ThemeProvider>
    );
}
