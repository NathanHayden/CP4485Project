"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventInput,
  EventContentArg,
} from "@fullcalendar/core";
import type { TravelEvent } from "./types";
import Card from "@/components/Card";
import TricolourBar from "@/components/TricolourBar";
import Button from "@/components/Button";
import MarkersMap from "@/components/map/MarkersMap";
import { ST_JOHNS_CENTER, CITY_ZOOM, type MapMarker } from "@/lib/map";

const fcTheme = {
  "--fc-border-color": "var(--color-line)",
  "--fc-button-bg-color": "#00a859",
  "--fc-button-border-color": "#00a859",
  "--fc-button-hover-bg-color": "#007a40",
  "--fc-button-hover-border-color": "#007a40",
  "--fc-button-active-bg-color": "#007a40",
  "--fc-button-active-border-color": "#007a40",
  "--fc-today-bg-color": "rgba(0,168,89,0.1)",
  // Transparent, because each event draws its own little chip below in
  // renderEvent. Left as a solid pink block, a long title turned into an
  // unreadable slab that spilled over the edge of the day.
  "--fc-event-bg-color": "transparent",
  "--fc-event-border-color": "transparent",
  "--fc-event-text-color": "var(--color-ink)",
  "--fc-page-bg-color": "var(--color-surface)",
  "--fc-neutral-bg-color": "var(--color-surface-muted)",
} as React.CSSProperties;

// FullCalendar reads the browser's clock and timezone as it renders, so letting
// it render on the server produces markup that does not match the client. Load
// it on the client only, which also saves us a "have I mounted yet" state flag.
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <p className="py-10 text-center text-sm text-fog">Loading calendar…</p>
  ),
});

// A colour per category so a month at a glance shows what kind of thing is
// on, without needing a key to read it.
const CATEGORY_DOT: Record<string, string> = {
  Music: "bg-nl-pink-600",
  "Food & Drink": "bg-amber-500",
  Festival: "bg-violet-500",
  Outdoors: "bg-nl-green",
  Arts: "bg-rose-500",
  Community: "bg-sky-500",
  Sports: "bg-orange-500",
  Other: "bg-fog",
};

// FullCalendar draws a coloured block by default, which cut long titles off
// mid-word and looked nothing like the rest of the site. This draws a small
// chip instead: a dot for the category, the time when there is one, and the
// title cut with an ellipsis rather than clipped. The full title is in the
// tooltip and in the panel below.
function renderEvent(arg: EventContentArg) {
  const event = arg.event.extendedProps as TravelEvent;
  const dot = CATEGORY_DOT[event.category]
    ? CATEGORY_DOT[event.category]
    : CATEGORY_DOT.Other;

  return (
    <div
      title={`${arg.event.title}${event.location ? ` — ${event.location}` : ""}`}
      className="flex w-full items-center gap-1 overflow-hidden rounded px-1 py-0.5"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {arg.timeText && (
        <span className="shrink-0 text-[0.6rem] font-bold text-fog">
          {arg.timeText}
        </span>
      )}
      <span className="truncate text-[0.7rem] font-semibold text-ink">
        {arg.event.title}
      </span>
    </div>
  );
}

function prettyTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = (h % 12) || 12;
  return `${hour}:${String(m).padStart(2, "0")}${period}`;
}

export default function EventsCalendar({
  events,
  currentUserId,
}: {
  events: TravelEvent[];
  currentUserId: string | null;
}) {
  const router = useRouter();

  const [selected, setSelected] = useState<TravelEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fcEvents = useMemo<EventInput[]>(
    () =>
      events.map((e) => {
        const endDay = e.endDate ? e.endDate : e.date;
        return {
          id: e._id,
          title: e.title,
          start: e.startTime ? `${e.date}T${e.startTime}` : e.date,
          end: e.endTime ? `${endDay}T${e.endTime}` : undefined,
          allDay: !e.startTime,
          extendedProps: e,
        };
      }),
    [events]
  );

  // The pins for the map beside the calendar. Built with a plain loop rather
  // than filter then map, because filter does not tell TypeScript that
  // latitude and longitude stopped being null.
  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    for (const event of events) {
      if (event.latitude === null || event.longitude === null) {
        continue;
      }
      list.push({
        id: event._id,
        title: event.title,
        subtitle: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        href: `/events/${event._id}`,
      });
    }
    return list;
  }, [events]);

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    setDeleteError(null);
    setSelected(info.event.extendedProps as TravelEvent);
  }

  // Clicking a pin opens the same details panel a calendar click does, so the
  // two halves of the page act like one thing rather than two.
  function handleMarkerClick(id: string) {
    const found = events.find((event) => event._id === id);
    if (found) {
      setDeleteError(null);
      setSelected(found);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"?`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/events/${selected._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data && data.error ? data.error : "Failed to delete event";
        throw new Error(message);
      }
      setSelected(null);
      // Ask the server component above us to re-run its query and send down
      // the updated list.
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete event"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* One row, two halves. Stacked on a phone and side by side from lg up,
          which is the breakpoint the rest of the app splits at. The map used
          to sit far below the calendar, where nobody scrolled to find it. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-4 sm:p-5" style={fcTheme}>
          <TricolourBar className="mb-4 h-1.5 w-full rounded-full" />
          {/* A month grid can only be squeezed so far before the day numbers
              collide. Below that it scrolls sideways instead of being cut off
              by the card, which is what used to happen on a narrow screen. */}
          <div className="overflow-x-auto">
            <div className="min-w-[19rem]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            firstDay={0}
            height="auto"
            events={fcEvents}
            eventClick={handleEventClick}
            eventContent={renderEvent}
            // Every event stays inside the day it belongs to. Drawn as blocks,
            // anything with an end date on a later day stretched into a bar
            // across several squares, which read as a mistake even though it
            // was correct. An event over more than one day now simply appears
            // on each of those days.
            eventDisplay="list-item"
            // Two rather than three, because each day box is narrower now
            // that the calendar only has half the width.
            dayMaxEvents={2}
          />
            </div>
          </div>
        </Card>

        {/* A flex column so the map can take whatever height is left under the
            heading and the caption. The row is as tall as the calendar, this
            card stretches to fill it, and flex-1 passes that height down to
            the map. The min height keeps it usable on a phone, where there is
            no calendar beside it to stretch against. */}
        <Card className="flex flex-col overflow-hidden p-4 sm:p-5">
          <h3 className="font-display text-lg font-extrabold">Event map</h3>

          {markers.length === 0 ? (
            <p className="mt-3 text-sm text-fog">
              No events have been pinned to the map yet. Drop a pin when you
              add or edit an event and it will show up here.
            </p>
          ) : (
            <>
              <div className="mt-3 min-h-[20rem] flex-1 overflow-hidden rounded-xl border border-line">
                <MarkersMap
                  markers={markers}
                  center={[ST_JOHNS_CENTER.latitude, ST_JOHNS_CENTER.longitude]}
                  zoom={CITY_ZOOM}
                  heightClass="h-full"
                  onMarkerClick={handleMarkerClick}
                />
              </div>
              <p className="mt-3 text-xs text-fog">
                {markers.length} of {events.length}{" "}
                {events.length === 1 ? "event has" : "events have"} a pin. Click
                a pin to see the details.
              </p>
            </>
          )}
        </Card>
      </div>

      {/* The details sit under both halves now. There is no "click an event"
          placeholder any more: an empty panel below the board would just be a
          strip of nothing. */}
      {selected && (
        <div>
          <h3 className="font-display text-lg font-extrabold">
            {selected.title}
          </h3>

          <Card className="mt-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="shrink-0 rounded-full bg-nl-green-50 px-2 py-0.5 text-[0.65rem] font-bold text-nl-green-700">
                {selected.category}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">
              {new Date(`${selected.date}T00:00:00`).toLocaleDateString(
                "en-CA",
                { weekday: "long", month: "long", day: "numeric" }
              )}
            </p>
            {(selected.startTime || selected.location) && (
              <p className="mt-1 text-xs font-medium text-fog">
                {prettyTime(selected.startTime)}
                {selected.startTime && selected.endTime
                  ? `–${prettyTime(selected.endTime)}`
                  : ""}
                {selected.startTime && selected.location ? " · " : ""}
                {selected.location}
              </p>
            )}
            {selected.description && (
              <p className="mt-2 text-sm text-ink/80">
                {selected.description}
              </p>
            )}
            {selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-bold text-nl-pink-700 hover:underline"
              >
                More info →
              </a>
            )}
            {selected.submittedBy && (
              <p className="mt-2 text-[0.65rem] text-fog">
                Added by {selected.submittedBy}
              </p>
            )}

            <Link
              href={`/events/${selected._id}`}
              className="mt-3 inline-block text-xs font-bold text-nl-green-700 hover:underline"
            >
              View full details →
            </Link>

            {currentUserId && selected.userId === currentUserId && (
              <>
                <div className="mt-4 flex gap-2">
                  <Button href={`/events/${selected._id}/edit`}>Edit</Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </div>
                {deleteError && (
                  <p className="mt-2 text-xs font-medium text-danger-text">
                    {deleteError}
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
