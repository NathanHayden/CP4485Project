# Special Feature — Interactive Map of Event Locations

## What it does

The site now shows *where* events actually happen, not just when.

There are three places you see it:

1. **Adding or editing an event.** Under the location box there is a small map
   of St. John's. You click the map to drop a pin on the spot the event
   happens, and the pin is saved with the event. The pin is optional, and you
   can take it off again with "Remove pin".
2. **The events page.** Under the calendar there is a map of the whole city
   with a pin for every event that has one. Clicking a pin opens a small popup
   with the event's name and location and a link through to its page.
3. **An event's own page.** If the event has a pin, a small map shows it
   close up so you can see the street it is on.

This fits the point of the site. It is a travel advisory for visitors, and a
visitor reading about an event usually wants to know where in the city it is
before they decide whether to go. Before this, the location was only a line of
text like "George Street", which is not much help if you have never been here.

## The technology

**Leaflet** is the mapping library, with **react-leaflet** as the React
wrapper around it, and map images (tiles) from **OpenStreetMap**.

I picked this combination over Google Maps on purpose. Google Maps needs an
API key attached to a billing account, and it charges per map load once you go
past the free allowance. Leaflet is open source, OpenStreetMap tiles are free
to use as long as you credit them, and neither one needs an account or a key.
That also meant there was no extra secret to configure when deploying. The
credit line OpenStreetMap asks for is in the bottom corner of every map.

Versions matter here. This project is on React 19, and react-leaflet version 4
only supports React 18 — installing it fails outright. Version 5 is the one
that supports React 19, so that is what the project uses.

## Why you click a map instead of typing an address

The obvious way to put events on a map is *geocoding*: take the address the
organiser typed and ask a service to convert it into coordinates.

I decided against it. Every geocoding service is either paid (Google's needs
billing turned on) or has rules about automated use that make it unreliable
from a hosted server rather than a home computer. On top of that, our location
field is free text, so people type things like "George Street" with no city or
postcode, and a geocoder often guesses wrong or finds nothing.

Clicking the map avoids all of it. There is no third-party service in the
middle, nothing to rate limit us, nothing that can quietly stop working after
the site is deployed, and the organiser puts the pin exactly where they mean
rather than trusting a guess. The trade-off is that it is a small amount of
extra work when adding an event, which seemed worth it.

## The main problem I had to solve

Leaflet is built for browsers, and it reads the browser's `window` object the
moment it is loaded. Next.js renders pages on the server first, where there is
no `window`, so simply importing Leaflet into a page crashes the build.

The fix is to load the map only in the browser. Next has `dynamic()` with the
option `ssr: false` for exactly this. The map components are split into two
files: an "Inner" file that is the only one allowed to import Leaflet, and a
wrapper file that pulls the Inner one in with `ssr: false`. The server never
even reads the Leaflet code. The project already used this same pattern for
the FullCalendar calendar, so the map follows it.

Two smaller problems came with it:

- **The default pin was a broken image.** Leaflet's marker points at an image
  using a path relative to its own stylesheet, and build tools move that file
  somewhere else. I copied the three marker images into `public/leaflet/` and
  build the marker with those paths instead.
- **The map floated over the navbar.** Leaflet gives its zoom buttons a very
  high stacking number, higher than the sticky navbar, so they showed through
  it when scrolling. Giving the map container its own stacking context in
  `globals.css` keeps them inside the map.

## How it fits the rest of the project

- The two coordinates are stored on the event document alongside the fields
  that were already there, so no new collection was needed.
- Events created before this feature existed have no coordinates at all. Every
  place that reads an event passes the value through a helper that returns
  `null` when it is missing, so old events keep working and simply do not
  appear on the map. There was no database migration.
- The pin travels to the server in two hidden form fields, so both the add
  form (which posts to an API route) and the edit form (which uses a server
  action) pick it up without either of them needing special handling.
- The map colours use the site's theme values, and the tiles are inverted in
  dark mode so the map is not a bright white rectangle on a dark page.
- The popups link to the event detail page, which gives that page a proper way
  in from the map.

## Files

| File | What it is |
|---|---|
| `src/lib/map.ts` | Shared settings and the coordinate helpers. Imports nothing, so it is safe to use on the server. |
| `src/components/map/leafletIcon.ts` | The marker icon, with the image paths fixed. |
| `src/components/map/MarkersMapInner.tsx` | The map that displays pins. Imports Leaflet. |
| `src/components/map/MarkersMap.tsx` | Loads the above in the browser only. |
| `src/components/map/LocationPickerInner.tsx` | The click-to-pin map. Imports Leaflet. |
| `src/components/map/LocationPicker.tsx` | Loads the picker in the browser only, and holds the chosen point in two hidden form fields. |
| `src/app/events/EventsMapSection.tsx` | The all-events map and its empty state. |
