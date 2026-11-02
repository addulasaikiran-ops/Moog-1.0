"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "moog-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setTheme(saved);
        applyTheme(saved);
      }
    } catch {
      // Storage may be unavailable; system preference remains the safe fallback.
    }
  }, []);

  function cycleTheme() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The in-memory theme still works when storage is unavailable.
    }
  }

  const label = theme === "system" ? "Theme: system" : theme === "light" ? "Theme: light" : "Theme: dark";
  return (
    <button className="moogThemeToggle" type="button" onClick={cycleTheme} aria-label={label} title={label}>
      {theme === "dark" ? <Moon size={18} strokeWidth={1.5} aria-hidden="true" /> : theme === "light" ? <Sun size={18} strokeWidth={1.5} aria-hidden="true" /> : <Monitor size={18} strokeWidth={1.5} aria-hidden="true" />}
      <span>{theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
