"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "maktabah-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      className="fixed bottom-20 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-bone text-ink shadow-lg shadow-pondok/10 transition hover:bg-cream focus:outline-none focus:ring-2 focus:ring-gold/40"
      onClick={toggleTheme}
      title={isDark ? "Mode terang" : "Mode gelap"}
      type="button"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
