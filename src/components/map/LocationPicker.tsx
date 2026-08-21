"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <p className="py-10 text-center text-sm text-fog">Loading map…</p>
  ),
});

export default function LocationPicker({
  defaultLatitude,
  defaultLongitude,
}: {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
}) {
  const [latitude, setLatitude] = useState<number | null>(defaultLatitude);
  const [longitude, setLongitude] = useState<number | null>(defaultLongitude);

  function handlePick(newLatitude: number, newLongitude: number) {
    setLatitude(newLatitude);
    setLongitude(newLongitude);
  }

  function handleClear() {
    setLatitude(null);
    setLongitude(null);
  }

  const hasPin = latitude !== null && longitude !== null;

  return (
    // Deliberately not wrapped in <Field>. Field renders a <label>, and a map
    // inside a label makes every click on it also try to focus a form input.
    // The label styling below is copied from Field to match the other rows.
    <div>
      <span className="text-sm font-semibold">Pin the spot (optional)</span>
      <p className="mt-1 text-xs text-fog">
        Click the map to drop a pin where the event happens.
      </p>

      <div className="mt-2 h-72 overflow-hidden rounded-lg border border-line-strong">
        <LocationPickerInner
          latitude={latitude}
          longitude={longitude}
          onPick={handlePick}
        />
      </div>

      {/* The map is a React component, but the form still posts ordinary form
          data, so the picked point travels in these two hidden boxes and the
          server reads them back with readCoordinates(). */}
      <input
        type="hidden"
        name="latitude"
        value={latitude === null ? "" : String(latitude)}
      />
      <input
        type="hidden"
        name="longitude"
        value={longitude === null ? "" : String(longitude)}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-fog">
          {hasPin
            ? `Pinned at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : "No pin yet — the event just won't show on the map."}
        </p>
        {hasPin && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-nl-pink-700 hover:underline"
          >
            Remove pin
          </button>
        )}
      </div>
    </div>
  );
}
