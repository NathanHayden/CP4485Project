"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/lib/map";

// Leaflet reads the browser's window object the moment it is imported, so
// letting it render on the server breaks the build. Loading it in the browser
// only is the same trick EventsCalendar.tsx uses for the calendar. The import
// lives in its own file so nothing map related is even read on the server.
const MarkersMapInner = dynamic(() => import("./MarkersMapInner"), {
  ssr: false,
  loading: () => (
    <p className="py-10 text-center text-sm text-fog">Loading map…</p>
  ),
});

export default function MarkersMap({
  markers,
  center,
  zoom,
  height = "26rem",
}: {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  height?: string;
}) {
  // The height is set out here so the "Loading map…" placeholder takes up the
  // same room the map will, and so the map's own 100% has something to
  // measure against.
  return (
    <div style={{ height }} className="w-full">
      <MarkersMapInner markers={markers} center={center} zoom={zoom} />
    </div>
  );
}
