import Link from "next/link";
import Card from "@/components/Card";
import EventForm from "../EventForm";

export const metadata = {
  title: "Add an Event · St. John's Travel Advisory",
  description: "Add a new event to the St. John's calendar.",
};

export default async function AddEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href="/events"
        className="text-sm font-semibold text-fog hover:text-nl-green-700"
      >
        ← Back to calendar
      </Link>

      <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Add an <span className="text-tricolour">Event</span>
      </h1>
      <p className="mt-3 text-base text-fog">
        Share something happening around St. John&apos;s. It will show up on the
        calendar once you submit.
      </p>

      <Card className="mt-10 p-6">
        <EventForm
          action="/api/events"
          method="POST"
          submitLabel="Add event"
          error={error}
        />
      </Card>
    </div>
  );
}
