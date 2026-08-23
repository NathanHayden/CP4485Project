const UNAVAILABLE = "Some readings are unavailable right now.";

// Readings Environment Canada does not publish for St. John's. Visibility is
// the one that matters most: the site used to show a Visibility box that was
// blank every single time, because it simply is not in their feed.
const EXTRA_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=47.5615&longitude=-52.7126" +
  "&current=visibility,cloud_cover,precipitation" +
  "&daily=uv_index_max,precipitation_sum,daylight_duration" +
  "&timezone=America%2FSt_Johns&forecast_days=1";

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// The daily lists come back with one entry, for today.
function firstOrNull(list: unknown): number | null {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  return numberOrNull(list[0]);
}

export async function GET() {
  try {
    const res = await fetch(EXTRA_URL, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.error(`Open-Meteo replied with ${res.status} for the extras.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current ? data.current : {};
    const daily = data.daily ? data.daily : {};

    return Response.json({
      // Metres from the service; the page turns it into kilometres.
      visibility: numberOrNull(current.visibility),
      cloudCover: numberOrNull(current.cloud_cover),
      precipitationNow: numberOrNull(current.precipitation),
      uvIndex: firstOrNull(daily.uv_index_max),
      precipitationToday: firstOrNull(daily.precipitation_sum),
      // Seconds of daylight; the page turns it into hours and minutes.
      daylightSeconds: firstOrNull(daily.daylight_duration),
    });
  } catch (error) {
    console.error("Could not reach Open-Meteo for the extras:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
