import {
  featuresToSuggestions,
  PHOTON_BIAS_LAT,
  PHOTON_BIAS_LON,
  GEOCODE_USER_AGENT,
} from "@/lib/geocode";

const UNAVAILABLE = "The address lookup is unavailable right now.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ? searchParams.get("q")!.trim() : "";

  // Too short to mean anything, and asking anyway would just be rude to a
  // service that is letting us use it for free.
  if (query.length < 3) {
    return Response.json([]);
  }

  const url =
    "https://photon.komoot.io/api/?q=" +
    encodeURIComponent(query) +
    `&limit=5&lat=${PHOTON_BIAS_LAT}&lon=${PHOTON_BIAS_LON}`;

  try {
    // Kept for a day. People type the same handful of addresses over and over
    // and the answers do not change, so this keeps our load low.
    const res = await fetch(url, {
      headers: { "User-Agent": GEOCODE_USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error(`Photon replied with ${res.status} for a search.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(featuresToSuggestions(data.features));
  } catch (error) {
    console.error("Could not reach the address service:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
