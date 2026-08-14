"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import type { TravelEvent } from "./types";
import Card from "@/components/Card";
import TricolourBar from "@/components/TricolourBar";
import Button from "@/components/Button";

const fcTheme = {
  "--fc-border-color": "var(--color-line)",
  "--fc-button-bg-color": "#00a859",
  "--fc-button-border-color": "#00a859",
  "--fc-button-hover-bg-color": "#007a40",
  "--fc-button-hover-border-color": "#007a40",
  "--fc-button-active-bg-color": "#007a40",
  "--fc-button-active-border-color": "#007a40",
  "--fc-today-bg-color": "rgba(0,168,89,0.1)",
  "--fc-event-bg-color": "#ff94cb",
  "--fc-event-border-color": "#ff94cb",
  "--fc-event-text-color": "#14201a",
  "--fc-page-bg-color": "var(--color-surface)",
  "--fc-neutral-bg-color": "var(--color-surface-muted)",
} as React.CSSProperties;

function prettyTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = (h % 12) || 12;
  return `${hour}:${String(m).padStart(2, "0")}${period}`;
}

export default function EventsCalendar({
  currentUserId,
}: {
  currentUserId: string | null;
}) {
  const [events, setEvents] = useState<TravelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TravelEvent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const loadEvents = useCallback(() => {
    setLoading(true);
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: TravelEvent[]) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    setDeleteError(null);
    setSelected(info.event.extendedProps as TravelEvent);
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
      loadEvents();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete event"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <Card className="overflow-hidden p-4 sm:p-5" style={fcTheme}>
        <TricolourBar className="mb-4 h-1.5 w-full rounded-full" />
        {mounted ? (
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
            dayMaxEvents={3}
          />
        ) : (
          <p className="py-10 text-center text-sm text-fog">
            Loading calendar…
          </p>
        )}
      </Card>

      <aside>
        <h3 className="font-display text-lg font-extrabold">
          {selected ? selected.title : "Event details"}
        </h3>

        {loading && <p className="mt-3 text-sm text-fog">Loading events…</p>}

        {!loading && !selected && (
          <p className="mt-3 text-sm text-fog">
            Click an event on the calendar to see the details.
          </p>
        )}

        {selected && (
          <Card className="mt-4 p-4">
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
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {deleteError}
                  </p>
                )}
              </>
            )}
          </Card>
        )}
      </aside>
    </div>
  );
}
