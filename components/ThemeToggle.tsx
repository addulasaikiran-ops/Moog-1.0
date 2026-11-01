"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "moog-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme === "system" ? "" : theme;
  root.style.colorScheme = theme === "system" ? "" : theme;
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
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {theme === "dark" ? <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z" /> : theme === "light" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18Z" /></>}
      </svg>
      <span>{theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
