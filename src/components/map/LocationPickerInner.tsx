"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
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

// react-leaflet reads the starting centre once, when the map is built, and
// ignores it afterwards. Moving the map later has to go through the map
// itself, which - like ClickToPlacePin above - means a child that draws
// nothing and only exists so the hook can find the map.
//
// It watches centerOn rather than the pin on purpose. The pin also moves when
// someone clicks the map, and re-centring on their own click would yank the
// map around under the pointer.
function RecenterMap({
  centerOn,
}: {
  centerOn: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (centerOn === null) {
      return;
    }
    map.setView([centerOn.latitude, centerOn.longitude], PIN_ZOOM);
  }, [map, centerOn]);

  return null;
}

export default function LocationPickerInner({
  latitude,
  longitude,
  centerOn,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  centerOn: { latitude: number; longitude: number } | null;
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
      <RecenterMap centerOn={centerOn} />
      {latitude !== null && longitude !== null && (
        <Marker position={[latitude, longitude]} icon={markerIcon} />
      )}
    </MapContainer>
  );
}
