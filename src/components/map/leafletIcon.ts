// Leaflet ships its marker image with a path like "images/marker-icon.png",
// written relative to wherever leaflet.css ends up. Build tools move that
// file, so the standard pin renders as a broken image. We copied the three
// images into /public/leaflet and build the icon ourselves.
//
// Note the named { Icon } import. Leaflet 1.9's module build has no default
// export, so "import L from 'leaflet'" type checks but can be undefined when
// it actually runs.
import { Icon } from "leaflet";

export const markerIcon = new Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41], // the real size of the image
  iconAnchor: [12, 41], // the tip of the pin, not its top left corner
  popupAnchor: [1, -34], // where the popup's little tail points
  shadowSize: [41, 41],
});
