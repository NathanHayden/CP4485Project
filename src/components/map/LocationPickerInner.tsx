"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { markerIcon } from "./leafletIcon";
import {
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  ST_JOHNS_CENTER,
  CITY_ZOOM,
  PIN_ZOOM,
} from "@/lib/map";

// react-leaflet has no onClick property on the map itself. The documented way
// to listen for clicks is to render a child inside the map that calls the
// useMapEvents hook. The hook has to be inside the map to find it, and this
// component draws nothing of its own.
function ClickToPlacePin({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(clickEvent: LeafletMouseEvent) {
      onPick(clickEvent.latlng.lat, clickEvent.latlng.lng);
    },
  });

  return null;
}

export default function LocationPickerInner({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
}) {
  // Written with if/else rather than a ternary so TypeScript can follow that
  // both numbers are real inside the branch.
  let center: [number, number] = [
    ST_JOHNS_CENTER.latitude,
    ST_JOHNS_CENTER.longitude,
  ];
  let zoom = CITY_ZOOM;

  if (latitude !== null && longitude !== null) {
    center = [latitude, longitude];
    zoom = PIN_ZOOM;
  }

  return (
    // center and zoom are starting values only. react-leaflet ignores later
    // changes to them, which is fine here: the map is built once, already
    // showing the saved pin when editing.
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <ClickToPlacePin onPick={onPick} />
      {latitude !== null && longitude !== null && (
        <Marker position={[latitude, longitude]} icon={markerIcon} />
      )}
    </MapContainer>
  );
}
