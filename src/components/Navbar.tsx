"use client";

import Link from "next/link";
import { useState } from "react";
import TricolourBar from "@/components/TricolourBar";
import { logout } from "@/app/auth/actions";

const links = [
  { href: "/", label: "Home" },
  { href: "/weather", label: "Weather" },
  { href: "/events", label: "Events" },
  { href: "/plan", label: "Plan my visit" },
];

type SessionUser = {
  name?: string;
  email?: string;
  picture?: string;
};

export default function Navbar({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface shadow-sm">
      <TricolourBar />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
          <span className="flex h-7 w-7 overflow-hidden rounded-md ring-1 ring-line">
            <span className="h-full w-1/3 bg-nl-green" />
            <span className="h-full w-1/3 bg-white" />
            <span className="h-full w-1/3 bg-nl-pink" />
          </span>
          Travel Advisory
        </Link>

        <ul className="hidden gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="font-semibold text-ink/70 transition-colors hover:text-nl-green-700"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="flex items-center gap-3">
            {user ? (
              <>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name ? user.name : "Profile"}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-line-strong"
                  />
                ) : null}
                {user.name ? (
                  <span className="font-semibold text-ink/80">
                    {user.name}
                  </span>
                ) : null}
                <form action={logout}>
                  <button
                    type="submit"
                    className="font-semibold text-ink/70 transition-colors hover:text-nl-green-700"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="font-semibold text-ink/70 transition-colors hover:text-nl-green-700"
              >
                Login
              </Link>
            )}
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="text-2xl leading-none md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-4 py-2 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 font-semibold text-ink/80 hover:bg-hover"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name ? user.name : "Profile"}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-line-strong"
                    />
                  ) : null}
                  {user.name ? (
                    <span className="font-semibold text-ink/80">
                      {user.name}
                    </span>
                  ) : null}
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left font-semibold text-ink/80 hover:bg-hover"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 font-semibold text-ink/80 hover:bg-hover"
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      )}
    </header>
  );
}
