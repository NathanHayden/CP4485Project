"use client";

// An error page has to be a client component, because Next hands it a reset()
// function to let the visitor retry without reloading the whole site.
import { useEffect } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Goes to the server logs, where we can actually read it. The visitor is
    // shown the friendly message below instead.
    console.error("Page failed to render:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <Card className="overflow-hidden">
        <div className="p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-fog">
            That page could not be loaded just now. It is usually temporary, so
            trying again often works.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button href="/" variant="danger">
              Back to the home page
            </Button>
          </div>

          {/* Next attaches a digest to server errors. Showing it gives us
              something to search the logs for if a visitor reports a problem. */}
          {error.digest && (
            <p className="mt-6 text-xs text-fog">
              Reference code: {error.digest}
            </p>
          )}
        </div>
        <div className="tricolour-bar h-1.5 w-full" />
      </Card>
    </div>
  );
}
