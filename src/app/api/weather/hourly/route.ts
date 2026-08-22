const UNAVAILABLE = "The hourly forecast is unavailable right now.";

// Ask for times as plain unix seconds rather than text. Open-Meteo's text
// timestamps carry no timezone marker, so a server running on UTC would read
// "14:00" in St. John's as 14:00 UTC and every hour would be shifted. Seconds
// since 1970 cannot be misread.
const HOURLY_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=47.5615&longitude=-52.7126" +
  "&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m" +
  "&timezone=America%2FSt_Johns&timeformat=unixtime&forecast_days=2";

export async function GET() {
  try {
    const res = await fetch(HOURLY_URL, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.error(`Open-Meteo replied with ${res.status} for the hourly forecast.`);
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    const data = await res.json();
    const hourly = data.hourly;

    if (!hourly || !Array.isArray(hourly.time)) {
      console.error("Open-Meteo sent no hourly forecast.");
      return Response.json({ error: UNAVAILABLE }, { status: 502 });
    }

    // The reply starts at midnight, so most of the first day is already in the
    // past. Keep the current hour onwards and stop after a full day.
    const startedAt = Date.now() / 1000 - 3600;
    const hours = [];

    for (let index = 0; index < hourly.time.length; index++) {
      const at = hourly.time[index];
      if (at < startedAt) {
        continue;
      }

      hours.push({
        at,
        temp: Math.round(hourly.temperature_2m[index]),
        rainChance: hourly.precipitation_probability
          ? hourly.precipitation_probability[index]
          : null,
        code: hourly.weather_code[index],
        wind: Math.round(hourly.wind_speed_10m[index]),
      });

      if (hours.length === 24) {
        break;
      }
    }

    return Response.json(hours);
  } catch (error) {
    console.error("Could not reach Open-Meteo for the hourly forecast:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
