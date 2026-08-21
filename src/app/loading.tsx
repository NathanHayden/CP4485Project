// Shown automatically while a page that reads the database or an outside
// service is still being put together on the server.
export default function Loading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-lg font-extrabold">One moment…</p>
      <p className="mt-1 text-sm text-fog">Getting the latest information.</p>
      <div className="mx-auto mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-hover">
        <div className="tricolour-bar animate-splash-bar h-full" />
      </div>
    </div>
  );
}
