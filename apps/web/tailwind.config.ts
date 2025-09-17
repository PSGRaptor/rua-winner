import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Brand palette: light blue theme + dark compat
                brand: {
                    DEFAULT: "#3AA7FF", // primary light blue
                    50:  "#F2F9FF",
                    100: "#E6F3FF",
                    200: "#BFE2FF",
                    300: "#99D2FF",
                    400: "#73C2FF",
                    500: "#3AA7FF",
                    600: "#0F8FEB",
                    700: "#0B6FB6",
                    800: "#084F80",
                    900: "#05314D"
                }
            },
            boxShadow: {
                soft: "0 4px 16px rgba(0,0,0,0.08)"
            },
            borderRadius: {
                "2xl": "1rem"
            }
        }
    },
    plugins: []
} satisfies Config;
