"use client";

import { useEffect, useRef, useState } from "react";
import { fieldInputClass } from "@/components/Field";
import type { AddressSuggestion } from "@/lib/geocode";

export default function AddressSearchField({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (text: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
}) {
  // What was last typed, as opposed to what is in the box. Choosing a
  // suggestion sets this back to null, which is what stops a fresh search
  // running on the address we just filled in.
  const [typed, setTyped] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Wait a third of a second after the last key before asking. Typing
  // "George Street" would otherwise send thirteen requests. Each time the
  // typing changes React runs the cleanup below first, throwing away the
  // timer that was still waiting.
  useEffect(() => {
    if (typed === null) {
      return;
    }

    // Answers can come back out of order, so a slow reply for "geor" could
    // land after a quick one for "george street" and replace it. The cleanup
    // sets this flag, and a reply for a search we have moved on from is
    // thrown away.
    //
    // Nothing is set on the way in here on purpose: opening the list and
    // showing "Searching…" are things the typing did, so they happen in
    // handleChange. Setting them here would make this effect start another
    // render the moment it ran.
    let ignore = false;

    const timer = setTimeout(() => {
      fetch(`/api/geocode/search?q=${encodeURIComponent(typed.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (ignore) {
            return;
          }
          setSuggestions(Array.isArray(data) ? data : []);
          setSearching(false);
        })
        .catch((error) => {
          if (ignore) {
            return;
          }
          console.error("Could not search for that address:", error);
          setSuggestions([]);
          setSearching(false);
        });
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [typed]);

  // Close the list when a click lands anywhere else on the page, including on
  // the map below, which is the usual way out of it.
  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () =>
      document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    onChange(text);

    // Too short to bother searching. Setting typed back to null also stops
    // the effect below from running at all.
    if (text.trim().length < 3) {
      setTyped(null);
      setSuggestions([]);
      setSearching(false);
      setOpen(false);
      return;
    }

    setTyped(text);
    setSearching(true);
    setOpen(true);
  }

  function handlePick(suggestion: AddressSuggestion) {
    onPick(suggestion);
    setTyped(null);
    setSuggestions([]);
    setOpen(false);
  }

  // Enter inside a form normally means "save". With the list open that is
  // almost never what was meant, so Enter takes the first suggestion instead.
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && open) {
      event.preventDefault();
      if (suggestions.length > 0) {
        handlePick(suggestions[0]);
      } else {
        setOpen(false);
      }
    }
  }

  return (
    // Deliberately not wrapped in <Field>. Field renders a <label>, and every
    // click inside a label jumps back to the input, so a list of choices in
    // there could never be clicked. Same reason LocationPicker avoids it.
    <div ref={boxRef} className="relative">
      <span className="text-sm font-semibold">Location</span>
      <input
        type="text"
        name="location"
        required
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        // Off so the browser's own list of past entries does not open on top
        // of ours.
        autoComplete="off"
        placeholder="Start typing an address…"
        className={fieldInputClass}
      />

      {open && (
        // The map further down the form sits in its own layer, so without a
        // number of our own this list would be drawn behind it.
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-lg border border-line-strong bg-surface shadow-sm">
          {searching && (
            <li className="px-3 py-2 text-sm text-fog">Searching…</li>
          )}

          {!searching && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-fog">
              No matching addresses.
            </li>
          )}

          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              {/* type="button" is not optional here: a button inside a form
                  with no type is a save button, so picking an address would
                  submit the whole event. */}
              <button
                type="button"
                onClick={() => handlePick(suggestion)}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-hover"
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
