"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeType = "aurora" | "particles" | "mesh" | "minimal" | "clouds" | "candy" | "sunset";

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeType>("aurora");

    const updateTheme = (t: ThemeType) => {
        setTheme(t);
        localStorage.setItem("app-theme", t);
        document.documentElement.setAttribute('data-theme', t);
    };

    useEffect(() => {
        const saved = localStorage.getItem("app-theme") as ThemeType;
        if (saved && ["aurora", "particles", "mesh", "minimal", "clouds", "candy", "sunset"].includes(saved)) {
            // eslint-disable-next-line
            setTheme(saved);
            document.documentElement.setAttribute('data-theme', saved);
        } else {
            // Default
            document.documentElement.setAttribute('data-theme', 'aurora');
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
