"use client";

// The button holds no React state on purpose. Which icon shows is decided by
// the "dark" class on the <html> element through Tailwind's dark: variants,
// and layout.tsx puts that class on before the page paints. Keeping a copy of
// the answer in a useState as well would only give React something to
// disagree with the server about on the first render.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");

    root.classList.toggle("dark", nextIsDark);

    // Remember the choice so the next visit starts the same way. Wrapped
    // because a browser with storage blocked throws instead of returning null.
    try {
      window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // Not being able to remember the theme is not worth breaking over.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-nl-pink-50 dark:hover:bg-nl-pink-50/10"
    >
      <span className="relative block h-5 w-5">
        {/* Moon: shown in light mode, spun away in dark mode. */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute inset-0 h-5 w-5 rotate-0 scale-100 text-fog opacity-100 transition-all duration-300 ease-out dark:-rotate-90 dark:scale-0 dark:opacity-0"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>

        {/* Sun: the other way round. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="absolute inset-0 h-5 w-5 rotate-90 scale-0 text-fog opacity-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100 dark:opacity-100"
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
