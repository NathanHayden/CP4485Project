import Card from "@/components/Card";
import MarkersMap from "@/components/map/MarkersMap";
import { ST_JOHNS_CENTER, CITY_ZOOM, type MapMarker } from "@/lib/map";
import type { TravelEvent } from "./types";

export default function EventsMapSection({ events }: { events: TravelEvent[] }) {
  // Built with a plain loop rather than filter then map, because filter does
  // not tell TypeScript that latitude and longitude stopped being null.
  const markers: MapMarker[] = [];
  for (const event of events) {
    if (event.latitude === null || event.longitude === null) {
      continue;
    }
    markers.push({
      id: event._id,
      title: event.title,
      subtitle: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      href: `/events/${event._id}`,
    });
  }

  if (markers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-fog">
          No events have been pinned to the map yet. Drop a pin when you add or
          edit an event and it will show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <MarkersMap
        markers={markers}
        center={[ST_JOHNS_CENTER.latitude, ST_JOHNS_CENTER.longitude]}
        zoom={CITY_ZOOM}
        height="26rem"
      />
      <p className="mt-3 text-xs text-fog">
        {markers.length} of {events.length}{" "}
        {events.length === 1 ? "event has" : "events have"} a pin. Click a pin to
        open the event.
      </p>
    </Card>
  );
}
