"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Note it has played, so the script in layout.tsx can hide it outright on
    // the next page load this visit. Without this the animation replays every
    // time the instructor refreshes or opens a link directly, which gets old
    // fast. It is sessionStorage rather than localStorage so a genuinely new
    // visit still gets the intro.
    try {
      window.sessionStorage.setItem("splashSeen", "1");
    } catch {
      // Storage being unavailable just means the intro plays again.
    }

    const fadeTimer = setTimeout(() => setHidden(true), 2000);
    const removeTimer = setTimeout(() => setVisible(false), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] flex flex-col overflow-hidden transition-opacity duration-500 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 flex">
        <div
          className="animate-splash-panel h-full flex-1 bg-nl-green"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="animate-splash-panel h-full flex-1 bg-white"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="animate-splash-panel h-full flex-1 bg-nl-pink"
          style={{ animationDelay: "0.2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="animate-splash-pop" style={{ animationDelay: "0.45s" }}>
          <span className="flex h-16 w-24 overflow-hidden rounded-lg shadow-xl ring-1 ring-black/10">
            <span className="h-full w-1/3 bg-nl-green" />
            <span className="h-full w-1/3 bg-white" />
            <span className="h-full w-1/3 bg-nl-pink" />
          </span>
        </div>

        <div
          className="animate-splash-rise text-center"
          style={{ animationDelay: "0.65s" }}
        >
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-nl-green-700 sm:text-5xl">
            Newfoundland
          </h1>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-nl-pink-600 sm:text-5xl">
            Travel Advisory
          </h1>
        </div>

        <p
          className="animate-splash-fade text-sm uppercase tracking-[0.3em] text-nl-green-700"
          style={{ animationDelay: "1s" }}
        >
          Weather &amp; Events
        </p>

        <div className="h-1 w-48 overflow-hidden rounded-full bg-nl-green/20">
          <div className="animate-splash-bar h-full rounded-full bg-gradient-to-r from-nl-pink-600 to-nl-green" />
        </div>
      </div>

      <div className="relative z-10 flex h-2">
        <div className="flex-1 bg-nl-pink" />
        <div className="flex-1 bg-white/50" />
        <div className="flex-1 bg-nl-green" />
      </div>
    </div>
  );
}