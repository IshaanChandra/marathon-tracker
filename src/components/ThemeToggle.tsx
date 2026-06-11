"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "mt_theme";
const THEME_COLORS = { light: "#f4f6fb", dark: "#0e1322" };

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  // Keep the iPhone PWA status bar in sync
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

export default function ThemeToggle() {
  // Render a stable icon until mounted; the real theme was applied pre-paint in layout
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // private mode — theme just won't persist
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-7 h-7 grid place-items-center rounded-full bg-soft text-sm hover:bg-edge transition-colors"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
