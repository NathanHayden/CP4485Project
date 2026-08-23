import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";
import { ObjectId } from "mongodb";
import { connectToDB } from "@/app/api/db";
import { validateEventInput } from "../../validateEvent";
import {
  readCoordinates,
  toCoordinate,
  LATITUDE_LIMIT,
  LONGITUDE_LIMIT,
} from "@/lib/map";
import Card from "@/components/Card";
import EventForm from "../../EventForm";

export const metadata = {
  title: "Edit Event · St. John's Travel Advisory",
  description: "Edit an existing event on the St. John's calendar.",
};

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  // Figure out who is signed in. The proxy already blocks logged-out users, but
  // we still need the user id so we can confirm they own this event.
  const session = (await cookies()).get("session");
  if (!session) {
    redirect("/login");
  }
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  let currentUserId: string;
  try {
    const { payload } = await jwtVerify(session.value, secret);
    currentUserId = payload.userId as string;
  } catch {
    redirect("/login");
  }

  const { db } = await connectToDB();
  const event = await db.collection("events").findOne({ _id: new ObjectId(id) });

  if (!event) {
    notFound();
  }

  // Don't let a signed-in user open the edit form for someone else's event.
  if (!event.userId || event.userId.toString() !== currentUserId) {
    redirect("/events");
  }

  async function updateEvent(formData: FormData) {
    "use server";

    // Re-check auth inside the action too, so it never relies on the proxy alone.
    const session = (await cookies()).get("session");
    if (!session) {
      redirect("/login");
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(session.value, secret));
    } catch {
      redirect("/login");
    }

    const eventId = formData.get("id") as string;
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const endDate = formData.get("endDate") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;

    const validationError = validateEventInput({
      title,
      date,
      endDate,
      startTime,
      endTime,
      location,
      description,
    });
    if (validationError) {
      redirect(`/events/${eventId}/edit?error=${encodeURIComponent(validationError)}`);
    }

    // Always set both, even when they are null. That is what lets an
    // organiser take a pin back off an event they had already pinned.
    const { latitude, longitude } = readCoordinates(formData);

    const { db } = await connectToDB();

    // Scope the update by userId so a user can only edit their own event.
    await db.collection("events").updateOne(
      {
        _id: new ObjectId(eventId),
        userId: new ObjectId(payload.userId as string),
      },
      {
        $set: {
          title,
          description: formData.get("description"),
          category: formData.get("category"),
          location: formData.get("location"),
          date,
          endDate,
          startTime,
          endTime,
          url: formData.get("url"),
          latitude,
          longitude,
        },
      }
    );

    revalidatePath("/events");
    redirect("/events");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href="/events"
        className="text-sm font-semibold text-fog hover:text-nl-green-700"
      >
        ← Back to calendar
      </Link>

      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Edit <span className="text-tricolour">Event</span>
      </h1>
      <p className="mt-3 text-base text-fog">
        Update the details below and save your changes.
      </p>

      <Card className="mt-10 p-6">
        <EventForm
          action={updateEvent}
          hiddenId={id}
          submitLabel="Save changes"
          error={error}
          defaultValues={{
            title: event.title ?? "",
            description: event.description ?? "",
            category: event.category ?? "Music",
            location: event.location ?? "",
            date: event.date ?? "",
            endDate: event.endDate ?? "",
            startTime: event.startTime ?? "",
            endTime: event.endTime ?? "",
            url: event.url ?? "",
            // This page reads the raw document rather than going through
            // toTravelEvent, so the same helper is used here to cope with
            // events that have no coordinates yet.
            latitude: toCoordinate(event.latitude, LATITUDE_LIMIT),
            longitude: toCoordinate(event.longitude, LONGITUDE_LIMIT),
          }}
        />
      </Card>
    </div>
  );
}
