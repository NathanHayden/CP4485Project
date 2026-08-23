"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/auth/actions";

export type SessionUser = {
  name?: string;
  email?: string;
  picture?: string;
};

// "albert hayden" becomes "AH" so the bar stays short. The full name is still
// there in the menu when it is opened.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0].charAt(0).toUpperCase();

  if (parts.length === 1) {
    return first;
  }

  return first + parts[parts.length - 1].charAt(0).toUpperCase();
}

// Shown in place of the photo when there is not one, and as the large circle
// at the top of the open menu.
function initial(user: SessionUser): string {
  const source = user.name ? user.name : user.email ? user.email : "?";
  return source.trim().charAt(0).toUpperCase();
}

export default function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close when a click lands anywhere else, and when Escape is pressed, which
  // is what people expect of a menu like this.
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-hover"
      >
        {user.picture ? (
          <Image
            src={user.picture}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-nl-green"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nl-green text-sm font-bold text-white ring-2 ring-nl-green">
            {initial(user)}
          </span>
        )}

        {user.name && (
          <span className="font-semibold tracking-wide text-ink/80">
            {initialsOf(user.name)}
          </span>
        )}

        {/* Turns over when the menu is open, the usual hint that this opens
            something. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`h-3 w-3 text-fog transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lg">
          <div className="flex items-center gap-3 border-b border-line p-4">
            {user.picture ? (
              <Image
                src={user.picture}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-nl-green"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nl-green text-base font-bold text-white">
                {initial(user)}
              </span>
            )}

            <div className="min-w-0">
              {user.name && (
                <p className="truncate font-display font-extrabold text-ink">
                  {user.name}
                </p>
              )}
              {user.email && (
                <p className="truncate text-xs text-fog" title={user.email}>
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <p className="px-4 pt-3 text-[0.65rem] font-bold uppercase tracking-wider text-fog">
            Signed in with Google
          </p>

          <form action={logout}>
            <button
              type="submit"
              className="mt-1 mb-2 block w-full px-4 py-2 text-left text-sm font-semibold text-ink/80 transition-colors hover:bg-hover"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
