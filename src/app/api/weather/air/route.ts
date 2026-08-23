const UNAVAILABLE = "The air quality reading is unavailable right now.";

// Open-Meteo keeps air quality on a separate host to the forecast, but it is
// the same free service and still needs no key.
const AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality" +
  "?latitude=47.5615&longitude=-52.7126" +
  "&current=european_aqi,pm2_5,pm10" +
  "&timezone=America%2FSt_Johns";

export async function GET() {
  try {
    const res = await fetch(AIR_URL, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.error(`Open-Meteo replied with ${res.status} for air quality.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current;

    if (!current) {
      console.error("Open-Meteo sent no air quality reading.");
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    return Response.json({
      aqi: typeof current.european_aqi === "number" ? current.european_aqi : null,
      pm25: typeof current.pm2_5 === "number" ? current.pm2_5 : null,
      pm10: typeof current.pm10 === "number" ? current.pm10 : null,
    });
  } catch (error) {
    console.error("Could not reach the air quality service:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
