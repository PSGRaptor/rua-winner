import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "../components/Providers";
import { Header } from "../components/Header";

export const metadata = {
    title: "RUA Winner — EuroJackpot Analysis",
    description: "EuroJackpot analysis and numbers evaluation to win."
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body>
        <Providers>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="mx-auto w-full max-w-6xl px-4 md:px-6 py-6 flex-1">
                    {children}
                </main>
                <footer className="border-t border-slate-200/60 dark:border-slate-700/60 py-6 text-sm text-slate-600 dark:text-slate-400">
                    <div className="mx-auto max-w-6xl px-4 md:px-6 flex items-center justify-between">
                        <span>© {new Date().getFullYear()} RUA Winner</span>
                        <span>EuroJackpot analysis & evaluation</span>
                    </div>
                </footer>
            </div>
        </Providers>
        </body>
        </html>
    );
}

