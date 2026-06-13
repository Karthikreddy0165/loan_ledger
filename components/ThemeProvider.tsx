"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import PremiumLoader from "./PremiumLoader";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [themeChanging, setThemeChanging] = useState(false);
  const [loaderLabel, setLoaderLabel] = useState("");

  useEffect(() => {
    // Read from localStorage or system settings
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setLoaderLabel(theme === "dark" ? "INITIALIZING LIGHT SPECTRUM" : "SYNTHESIZING DARK MATRIX");
    setThemeChanging(true);
    
    // Switch the theme after 250ms (in the middle of the fade-in animation)
    setTimeout(() => {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, 250);

    // Hide loader after 700ms (completed smooth transition)
    setTimeout(() => {
      setThemeChanging(false);
    }, 700);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <PremiumLoader show={themeChanging} label={loaderLabel} />
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
