import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";

export const metadata = {
  title: "Page not found · St. John's Travel Advisory",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <Card className="overflow-hidden">
        <div className="p-8">
          <p className="font-display text-6xl font-extrabold text-nl-green-700">
            404
          </p>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
            We can&apos;t find that page
          </h1>
          <p className="mt-3 text-sm text-fog">
            The link may be out of date, or the event may have been removed from
            the calendar.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/">Back to the home page</Button>
            <Link
              href="/events"
              className="inline-block rounded-full px-6 py-3 text-center text-sm font-bold text-fog transition-colors hover:bg-hover"
            >
              Browse events
            </Link>
          </div>
        </div>
        <div className="tricolour-bar h-1.5 w-full" />
      </Card>
    </div>
  );
}
