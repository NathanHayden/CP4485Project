import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDB } from "@/app/api/db";
import { planRequestSchema, MAX_TRIP_DAYS } from "@/app/plan/schema";
import { generateTravelPlan } from "@/lib/ai/travelPlan";

export const dynamic = "force-dynamic";

// Building a plan can take a while: up to MAX_ATTEMPTS tries at the model,
// one after another, plus the forecast and the database lookup. Hosting
// platforms cut a request off after a default that is shorter than that, so
// we ask for the full minute. Without this a slow plan is killed part way
// and the visitor gets a blank gateway error instead of our own message.
export const maxDuration = 60;

const ST_JOHNS_LAT = 47.5615;
const ST_JOHNS_LON = -52.7126;

const WEATHER_CODE_TEXT: Record<number, string> = {
  0: "clear",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "freezing fog",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  85: "snow showers",
  86: "heavy snow showers",
  95: "thunderstorms",
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_TEXT[code] ? WEATHER_CODE_TEXT[code] : "changeable";
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

async function getSignedInName(): Promise<string> {
  const session = (await cookies()).get("session");
  if (!session) {
    return "";
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(session.value, secret);
    return payload.name ? (payload.name as string) : "";
  } catch {
    return "";
  }
}

async function getForecastLines(
  startDate: string,
  endDate: string
): Promise<string> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${ST_JOHNS_LAT}&longitude=${ST_JOHNS_LON}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=16`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    return "No forecast available for these dates.";
  }

  const data = await res.json();
  const daily = data.daily;

  // A 200 is not proof the body is what we expect, so check before reading
  // through it. The planner can still build a trip without a forecast.
  if (!daily || !Array.isArray(daily.time)) {
    return "No forecast available for these dates.";
  }

  const lines: string[] = [];
  daily.time.forEach((date: string, index: number) => {
    if (date >= startDate && date <= endDate) {
      const high = Math.round(daily.temperature_2m_max[index]);
      const low = Math.round(daily.temperature_2m_min[index]);
      const text = describeWeatherCode(daily.weather_code[index]);
      lines.push(`${date}: high ${high}C, low ${low}C, ${text}`);
    }
  });

  if (lines.length === 0) {
    return "No forecast available for these dates (they are more than two weeks away).";
  }

  return lines.join("\n");
}

// Returns the lines we show the model, plus the set of ids we actually gave it.
// We keep the ids so we can check afterwards that the model only pointed at
// events that really exist, instead of trusting whatever it wrote back.
async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<{ lines: string; validIds: Set<string> }> {
  const { db } = await connectToDB();

  const events = await db
    .collection("events")
    .find({ date: { $lte: endDate } })
    .sort({ date: 1, startTime: 1 })
    .toArray();

  const overlapping = events.filter((event) => {
    const lastDay = event.endDate ? event.endDate : event.date;
    return lastDay >= startDate;
  });

  if (overlapping.length === 0) {
    return {
      lines: "There are no events on the calendar during these dates.",
      validIds: new Set(),
    };
  }

  const shown = overlapping.slice(0, 25);
  const validIds = new Set(shown.map((event) => event._id.toString()));

  const lines = shown.map((event) => {
    const id = event._id.toString();
    const runsUntil = event.endDate ? ` to ${event.endDate}` : "";
    const time = event.startTime ? ` at ${event.startTime}` : "";
    const details = event.description ? ` — ${event.description}` : "";
    return `id=${id} | ${event.date}${runsUntil}${time} | ${event.title} | ${event.category} | ${event.location}${details}`;
  });

  return { lines: lines.join("\n"), validIds };
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "The AI planner is not configured yet." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = planRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return Response.json(
      { error: firstIssue ? firstIssue.message : "Invalid request." },
      { status: 400 }
    );
  }

  const { startDate, endDate, interests, travellingWith, pace, notes } =
    parsed.data;

  if (endDate < startDate) {
    return Response.json(
      { error: "Your departure date can't be before your arrival date." },
      { status: 400 }
    );
  }

  const tripLength = daysBetween(startDate, endDate);
  if (tripLength > MAX_TRIP_DAYS) {
    return Response.json(
      { error: `Please choose a trip of ${MAX_TRIP_DAYS} days or fewer.` },
      { status: 400 }
    );
  }

  const [name, forecast, calendar] = await Promise.all([
    getSignedInName(),
    getForecastLines(startDate, endDate),
    getCalendarEvents(startDate, endDate),
  ]);

  const outcome = await generateTravelPlan(
    {
      startDate,
      endDate,
      tripLength,
      interests,
      travellingWith,
      pace,
      notes,
      visitorName: name,
      forecast,
      calendarEvents: calendar.lines,
    },
    calendar.validIds
  );

  if (outcome.status === "rate-limited") {
    return Response.json(
      {
        error:
          "The planner is busy right now. Please wait about a minute and try again.",
      },
      { status: 429 }
    );
  }

  if (outcome.status === "failed") {
    return Response.json(
      { error: "The planner couldn't build a plan just now. Please try again." },
      { status: 502 }
    );
  }

  return Response.json(outcome.plan);
}
