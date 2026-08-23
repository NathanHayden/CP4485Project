// Everything both halves of the address lookup agree on. Like lib/map.ts this
// file deliberately imports NOTHING: the route handlers read it on the server
// and the event form reads it in the browser.

// Photon takes a point to lean its answers towards. Ours is downtown
// St. John's, so "George Street" finds ours rather than one in Sydney.
export const PHOTON_BIAS_LAT = 47.5615;
export const PHOTON_BIAS_LON = -52.7126;

// Photon is free and needs no key, so a polite name is the only thing that
// identifies us. Some public services refuse requests with no name at all,
// which is the sort of thing that only shows up once deployed.
export const GEOCODE_USER_AGENT =
  "StJohnsTravelAdvisory/1.0 (student project)";

// One row in the suggestion list, and what the form keeps when one is picked.
export type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
};

// Photon hands back the pieces of an address separately. This glues them into
// one readable line and leaves out the pieces it did not send.
export function photonLabel(properties: PhotonProperties): string {
  const parts: string[] = [];

  if (properties.name) {
    parts.push(properties.name);
  }

  // For a plain street result Photon puts the street name in BOTH name and
  // street, which would read "New Gower Street, New Gower Street" without
  // this check.
  if (properties.street && properties.street !== properties.name) {
    if (properties.housenumber) {
      parts.push(`${properties.housenumber} ${properties.street}`);
    } else {
      parts.push(properties.street);
    }
  }

  if (properties.city) {
    parts.push(properties.city);
  }
  if (properties.state) {
    parts.push(properties.state);
  }

  return parts.join(", ");
}

// Turns Photon's reply into our own simple list. Written as a loop with a
// check at every step, because a free service can answer with anything and a
// missing field here would break the form.
export function featuresToSuggestions(features: unknown): AddressSuggestion[] {
  const list: AddressSuggestion[] = [];

  if (!Array.isArray(features)) {
    return list;
  }

  for (let index = 0; index < features.length; index++) {
    const feature = features[index];
    if (!feature || !feature.geometry || !feature.properties) {
      continue;
    }

    const coordinates = feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue;
    }

    // Map data writes coordinates the opposite way round to everything else
    // in this project: longitude first, then latitude.
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const label = photonLabel(feature.properties);
    if (label === "") {
      continue;
    }

    list.push({
      id: `${latitude},${longitude},${index}`,
      label,
      latitude,
      longitude,
    });
  }

  return list;
}
