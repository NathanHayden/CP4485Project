import { featuresToSuggestions, GEOCODE_USER_AGENT } from "@/lib/geocode";
import { toCoordinate, LATITUDE_LIMIT, LONGITUDE_LIMIT } from "@/lib/map";

const UNAVAILABLE = "The address lookup is unavailable right now.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Same helper the event form uses, so a bad number is rejected the same way
  // in both places.
  const latitude = toCoordinate(searchParams.get("lat"), LATITUDE_LIMIT);
  const longitude = toCoordinate(searchParams.get("lon"), LONGITUDE_LIMIT);

  if (latitude === null || longitude === null) {
    return Response.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const url = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": GEOCODE_USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error(`Photon replied with ${res.status} for a reverse lookup.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    const list = featuresToSuggestions(data.features);

    // Answering with null rather than an error when there is simply nothing at
    // that spot, which happens out on the water.
    return Response.json(list.length > 0 ? list[0] : null);
  } catch (error) {
    console.error("Could not reach the address service:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
