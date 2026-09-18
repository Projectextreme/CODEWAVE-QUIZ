"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-cyan-100 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
