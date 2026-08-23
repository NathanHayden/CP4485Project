import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import EventsCalendar from "./EventsCalendar";
import { getAllEvents } from "./queries";
import Button from "@/components/Button";

export const metadata = {
  title: "Events · St. John's Travel Advisory",
  description: "Upcoming events around St. John's, month by month.",
};

export default async function EventsPage() {
  // Work out who is signed in so we can show the Add button only to them and
  // let the calendar show Edit/Delete only on events they own.
  const session = (await cookies()).get("session");
  let currentUserId: string | null = null;
  if (session) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(session.value, secret);
      currentUserId = payload.userId as string;
    } catch {
      currentUserId = null;
    }
  }

  // Loaded here on the server so the calendar arrives with its events already
  // in place, instead of the browser making a second request after it mounts.
  const events = await getAllEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="text-tricolour">Event Calendar</span>
        </h1>

        {currentUserId ? (
          <Button href="/events/add">+ Add event</Button>
        ) : (
          <Button href="/login">Log in to add events</Button>
        )}
      </div>

      {events.length === 0 && (
        <p className="mt-8 rounded-2xl border border-line bg-surface-muted px-5 py-4 text-sm text-fog">
          There are no events on the calendar yet.{" "}
          {currentUserId
            ? "Add the first one with the button above."
            : "Log in to add the first one."}
        </p>
      )}

      {/* The calendar and the map are both inside here now, side by side. */}
      <div className="mt-8">
        <EventsCalendar events={events} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
