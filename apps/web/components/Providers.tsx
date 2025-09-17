"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { DataProvider } from "./DataContext";


export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <DataProvider>{children}</DataProvider>
        </ThemeProvider>
    );
}
