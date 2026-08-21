import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import EventsCalendar from "./EventsCalendar";
import EventsMapSection from "./EventsMapSection";
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

      <div className="mt-10">
        <EventsCalendar events={events} currentUserId={currentUserId} />
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Event map
        </h2>
        <p className="mt-2 text-sm text-fog">
          Every event that has been pinned to a spot around town.
        </p>
        <div className="mt-6">
          <EventsMapSection events={events} />
        </div>
      </div>
    </div>
  );
}
