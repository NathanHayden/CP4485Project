// Environment Canada is a public service with no uptime guarantee, and it may
// treat requests from a datacentre differently than ones from a home
// connection. Every failure is turned into a 502 with a message, so a bad day
// upstream shows as "unavailable" instead of crashing the page that calls us.
const UNAVAILABLE = "The weather service is unavailable right now.";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.weather.gc.ca/collections/citypageweather-realtime/items/nl-24",
      // Cached for ten minutes, the same as the nearby route. Without this we
      // called Environment Canada again on every single page view.
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      console.error(`Environment Canada replied with ${res.status}.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    return Response.json(await res.json());
  } catch (error) {
    console.error("Could not reach Environment Canada:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
