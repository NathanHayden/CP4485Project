"use client";

// leaflet.css is imported here in the component rather than in globals.css.
// It refers to its own image files with relative urls that only resolve when
// the bundler reads the file from inside the leaflet package. This file only
// ever loads in the browser, so the styles arrive together with the map.
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { markerIcon } from "./leafletIcon";
import { OSM_TILE_URL, OSM_ATTRIBUTION, type MapMarker } from "@/lib/map";

// Leaflet measures its box once, when the map is built, and never looks again
// unless the whole window resizes. On the events page the map sits beside the
// calendar, and the two load separately: the map often arrives first, measures
// a short box, and is then stretched when the calendar turns up. Leaflet does
// not notice, so half the map is drawn as grey nothing. This watches the box
// and asks Leaflet to measure again whenever it changes.
//
// It is a child component for the same reason ClickToPlacePin is one over in
// LocationPickerInner: useMap can only find the map from inside it. It draws
// nothing of its own.
function KeepMapSized() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function MarkersMapInner({
  markers,
  center,
  zoom,
  onMarkerClick,
}: {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  onMarkerClick?: (id: string) => void;
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
      <KeepMapSized />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={markerIcon}
          eventHandlers={{
            click: () => {
              if (onMarkerClick) {
                onMarkerClick(marker.id);
              }
            },
          }}
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
