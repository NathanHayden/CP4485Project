"use client";

import dynamic from "next/dynamic";

const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <p className="py-10 text-center text-sm text-fog">Loading map…</p>
  ),
});

// The pin used to be remembered in here. It now lives in the event form
// instead, because picking an address from the search box has to move the pin
// too, and the search box is up in the form. This component draws the map and
// reports clicks back; the form decides what the pin is.
export default function LocationPicker({
  latitude,
  longitude,
  centerOn,
  onPick,
  onClear,
}: {
  latitude: number | null;
  longitude: number | null;
  centerOn: { latitude: number; longitude: number } | null;
  onPick: (latitude: number, longitude: number) => void;
  onClear: () => void;
}) {
  const hasPin = latitude !== null && longitude !== null;

  return (
    // Deliberately not wrapped in <Field>. Field renders a <label>, and a map
    // inside a label makes every click on it also try to focus a form box.
    // The label styling below is copied from Field to match the other rows.
    <div>
      <span className="text-sm font-semibold">Pin the spot (optional)</span>
      <p className="mt-1 text-xs text-fog">
        Click the map to drop a pin, or search for an address above and we will
        drop it for you.
      </p>

      <div className="mt-2 h-72 overflow-hidden rounded-lg border border-line-strong lg:h-[26rem]">
        <LocationPickerInner
          latitude={latitude}
          longitude={longitude}
          centerOn={centerOn}
          onPick={onPick}
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
            onClick={onClear}
            className="text-xs font-bold text-nl-pink-700 hover:underline"
          >
            Remove pin
          </button>
        )}
      </div>
    </div>
  );
}
