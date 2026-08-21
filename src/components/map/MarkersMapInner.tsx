"use client";

// leaflet.css is imported here in the component rather than in globals.css.
// It refers to its own image files with relative urls that only resolve when
// the bundler reads the file from inside the leaflet package. This file only
// ever loads in the browser, so the styles arrive together with the map.
import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { markerIcon } from "./leafletIcon";
import { OSM_TILE_URL, OSM_ATTRIBUTION, type MapMarker } from "@/lib/map";

export default function MarkersMapInner({
  markers,
  center,
  zoom,
}: {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      // Without this the page stops scrolling and starts zooming the moment
      // the pointer crosses the map, which is annoying on a long page.
      scrollWheelZoom={false}
      // Leaflet measures itself against its container, so it needs a real
      // height. The wrapper component supplies one and we fill it.
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={markerIcon}
        >
          {marker.href !== "" && (
            <Popup>
              <span className="block font-bold">{marker.title}</span>
              {marker.subtitle !== "" && (
                <span className="block text-fog">{marker.subtitle}</span>
              )}
              <Link
                href={marker.href}
                className="mt-1 block font-bold text-nl-pink-700"
              >
                View event →
              </Link>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
