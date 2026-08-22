const UNAVAILABLE = "The forecast is unavailable right now.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return Response.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.error(`Open-Meteo replied with ${res.status}.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    const daily = data.daily;

    // Open-Meteo answers errors with a JSON body too, so a 200 is not enough
    // on its own - check the shape before reading through it.
    if (!daily || !Array.isArray(daily.time)) {
      console.error("Open-Meteo sent no daily forecast.");
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    // rainChance and uvIndex can be null for days at the edge of the range,
    // so they are passed through as-is and checked where they are shown.
    const days = daily.time.map((date: string, index: number) => ({
      date,
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      code: daily.weather_code[index],
      rainChance: daily.precipitation_probability_max
        ? daily.precipitation_probability_max[index]
        : null,
      uvIndex: daily.uv_index_max ? daily.uv_index_max[index] : null,
    }));

    return Response.json(days);
  } catch (error) {
    console.error("Could not reach Open-Meteo:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
