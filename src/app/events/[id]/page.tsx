import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getEventById } from "../queries";
import MarkersMap from "@/components/map/MarkersMap";
import { PIN_ZOOM } from "@/lib/map";
import Card from "@/components/Card";
import Button from "@/components/Button";

export const metadata = {
  title: "Event · St. John's Travel Advisory",
  description: "Details for an event on the St. John's calendar.",
};

function longDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Turns the two date fields into one line, since most events are a single day.
function whenText(date: string, endDate: string): string {
  if (endDate && endDate !== date) {
    return `${longDate(date)} — ${longDate(endDate)}`;
  }
  return longDate(date);
}

function timeText(startTime: string, endTime: string): string {
  if (startTime && endTime) {
    return `${startTime} to ${endTime}`;
  }
  if (startTime) {
    return `From ${startTime}`;
  }
  return "Time to be announced";
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getEventById returns null for a malformed id as well as a missing one.
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  // Anyone can read an event, but only the owner gets the Edit button.
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

  const ownsEvent = currentUserId !== null && event.userId === currentUserId;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link
        href="/events"
        className="text-sm font-semibold text-fog hover:text-nl-green-700"
      >
        ← Back to calendar
      </Link>

      <Card className="mt-6 overflow-hidden">
        <div className="p-6">
          <span className="rounded-full bg-nl-green-50 px-3 py-1 text-xs font-bold text-nl-green-700">
            {event.category}
          </span>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {event.title}
          </h1>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-bold text-fog">When</dt>
              <dd>{whenText(event.date, event.endDate)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-bold text-fog">Time</dt>
              <dd>{timeText(event.startTime, event.endTime)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 font-bold text-fog">Where</dt>
              <dd>{event.location}</dd>
            </div>
            {(event.submitter || event.submittedBy) && (
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 font-bold text-fog">Added by</dt>
                <dd className="flex items-center gap-2">
                  {/* Name and picture come from the users collection via the
                      $lookup, falling back to the name copied onto the event
                      when it was created. */}
                  {event.submitter && event.submitter.picture && (
                    <Image
                      src={event.submitter.picture}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  {event.submitter && event.submitter.name
                    ? event.submitter.name
                    : event.submittedBy}
                </dd>
              </div>
            )}
          </dl>

          {/* Checking both values keeps events added before the map existed
              working, and it is also what tells TypeScript the numbers are
              really numbers by the time the map reads them. */}
          {event.latitude !== null && event.longitude !== null && (
            <div className="mt-5 overflow-hidden rounded-xl border border-line">
              <MarkersMap
                markers={[
                  {
                    id: event._id,
                    title: event.title,
                    subtitle: event.location,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    href: "",
                  },
                ]}
                center={[event.latitude, event.longitude]}
                zoom={PIN_ZOOM}
                height="16rem"
              />
            </div>
          )}

          {event.description && (
            <p className="mt-5 border-t border-line pt-5 text-base leading-relaxed">
              {event.description}
            </p>
          )}

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-bold text-nl-green-700 hover:underline"
            >
              Visit the event website →
            </a>
          )}

          {ownsEvent && (
            <div className="mt-6 border-t border-line pt-5">
              <Button href={`/events/${id}/edit`}>Edit this event</Button>
            </div>
          )}
        </div>
        <div className="tricolour-bar h-1.5 w-full" />
      </Card>
    </div>
  );
}
