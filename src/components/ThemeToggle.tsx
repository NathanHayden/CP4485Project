"use client";

import { useState } from "react";

export default function ThemeToggle() {
  // isDark = false means light mode (default)
  const [isDark, setIsDark] = useState(false);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-nl-pink-50 dark:hover:bg-nl-pink-50/10"
    >
      <span className="relative block h-5 w-5">
        {/* Moon (Default icon displayed in light mode) */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`absolute inset-0 h-5 w-5 text-fog transition-all duration-300 ease-out ${
            isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>

        {/* Sun (Icon displayed when toggled to dark mode) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`absolute inset-0 h-5 w-5 text-fog transition-all duration-300 ease-out ${
            isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        </svg>
      </span>
    </button>
  );
}