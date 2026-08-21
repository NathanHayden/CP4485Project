// Shared map settings and the coordinate helpers used on the server.
//
// This file deliberately imports NOTHING. It is pulled in by client
// components, by the events route handler and by the edit page's server
// action. Importing Leaflet here would drag a browser-only library into the
// server bundle, which builds fine locally and then fails once deployed.

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Downtown St. John's, where every map starts before it has a pin.
export const ST_JOHNS_CENTER = { latitude: 47.5615, longitude: -52.7126 };

export const CITY_ZOOM = 12; // the whole city fits on screen
export const PIN_ZOOM = 15; // close enough to see the streets

export const LATITUDE_LIMIT = 90;
export const LONGITUDE_LIMIT = 180;

// Everything a map component needs to draw one pin. An empty href means the
// pin has no popup link, which is what the single-event maps use.
export type MapMarker = {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  href: string;
};

// Turns anything at all into a real number, or null when it cannot. The empty
// cases are checked first because Number("") and Number(null) are both 0,
// which would otherwise look like a valid coordinate out in the ocean.
export function toCoordinate(value: unknown, limit: number): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < -limit || parsed > limit) {
    return null;
  }

  return parsed;
}

// Reads the pin out of a submitted event form. Half a pair is meaningless, so
// if either number is missing or out of range we store no pin at all.
export function readCoordinates(formData: FormData): {
  latitude: number | null;
  longitude: number | null;
} {
  const latitude = toCoordinate(formData.get("latitude"), LATITUDE_LIMIT);
  const longitude = toCoordinate(formData.get("longitude"), LONGITUDE_LIMIT);

  if (latitude === null || longitude === null) {
    return { latitude: null, longitude: null };
  }

  return { latitude, longitude };
}
