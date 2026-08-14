import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDB } from "@/app/api/db";
import {
  planRequestSchema,
  travelPlanSchema,
  MAX_TRIP_DAYS,
} from "@/app/plan/schema";

export const dynamic = "force-dynamic";

const ST_JOHNS_LAT = 47.5615;
const ST_JOHNS_LON = -52.7126;

// The model occasionally drops a stray value into the "days" array, which Groq
// rejects as json_validate_failed. Asking again usually produces a clean plan.
const MAX_ATTEMPTS = 3;

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

async function getEventLines(
  startDate: string,
  endDate: string
): Promise<string> {
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
    return "There are no events on the calendar during these dates.";
  }

  const lines = overlapping.slice(0, 25).map((event) => {
    const id = event._id.toString();
    const runsUntil = event.endDate ? ` to ${event.endDate}` : "";
    const time = event.startTime ? ` at ${event.startTime}` : "";
    const details = event.description ? ` — ${event.description}` : "";
    return `id=${id} | ${event.date}${runsUntil}${time} | ${event.title} | ${event.category} | ${event.location}${details}`;
  });

  return lines.join("\n");
}

// The AI SDK throws either a single API error with a statusCode on it, or a
// retry error that holds the underlying attempts in an "errors" array. This
// gathers the status codes out of both shapes.
function getStatusCodes(error: unknown): number[] {
  const codes: number[] = [];

  if (!error || typeof error !== "object") {
    return codes;
  }

  const outer = error as { statusCode?: number; errors?: unknown[] };
  if (typeof outer.statusCode === "number") {
    codes.push(outer.statusCode);
  }

  if (Array.isArray(outer.errors)) {
    outer.errors.forEach((attempt) => {
      if (attempt && typeof attempt === "object") {
        const inner = attempt as { statusCode?: number };
        if (typeof inner.statusCode === "number") {
          codes.push(inner.statusCode);
        }
      }
    });
  }

  return codes;
}

function isRateLimited(error: unknown): boolean {
  return getStatusCodes(error).includes(429);
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

  const [name, forecast, calendarEvents] = await Promise.all([
    getSignedInName(),
    getForecastLines(startDate, endDate),
    getEventLines(startDate, endDate),
  ]);

  const greeting = name
    ? `The visitor is signed in and their name is ${name}. Address them by name in the overview.`
    : "The visitor is not signed in, so keep the tone welcoming but general.";

  const prompt = `You are a local travel advisor for St. John's, Newfoundland and Labrador, Canada.

Build a day by day plan for a visitor.

VISITOR
${greeting}
Arriving: ${startDate}
Leaving: ${endDate}
Trip length: ${tripLength} day(s)
Interests: ${interests.join(", ")}
Travelling as: ${travellingWith}
Preferred pace: ${pace}
Extra notes from the visitor: ${notes ? notes : "(none)"}

EVENTS ON OUR SITE'S CALENDAR DURING THE TRIP
${calendarEvents}

WEATHER FORECAST FOR ST. JOHN'S
${forecast}

RULES
1. Create exactly one entry in "days" for every date from ${startDate} to ${endDate} inclusive, in order.
2. Prefer the real calendar events above when they match the visitor's interests. When you use one, copy its name, set fromCalendar to true and put its id in eventId.
3. You may add your own well known St. John's suggestions (Signal Hill, Cape Spear, Quidi Vidi, The Rooms, Jellybean Row, George Street, Petty Harbour and similar) to fill the gaps. For those set fromCalendar to false and leave eventId as an empty string.
4. Never invent a calendar event that is not listed above.
5. Match the pace: Relaxed means 2 activities a day, Balanced means 3, Packed means 4.
6. Use the forecast. Put indoor activities on wet or foggy days and outdoor ones on clear days, and say so in weatherNote and in the reason.
7. matchScore is 1 to 100 and reflects how well the activity fits the stated interests.`;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await generateObject({
        model: groq("openai/gpt-oss-20b"),
        schema: travelPlanSchema,
        schemaName: "travel_plan",
        schemaDescription: "A day by day travel plan for St. John's.",
        maxOutputTokens: 4000,
        // We do our own retrying below, so the SDK should not also retry and
        // spend a second call's worth of tokens behind our back.
        maxRetries: 0,
        providerOptions: {
          groq: { reasoningEffort: "low", reasoningFormat: "hidden" },
        },
        prompt,
      });

      return Response.json(result.object);
    } catch (error) {
      lastError = error;

      // Trying again straight away would only burn more of the token budget,
      // so stop and tell the visitor to come back in a moment.
      if (isRateLimited(error)) {
        console.error("AI plan hit the Groq rate limit:", error);
        return Response.json(
          {
            error:
              "The planner is busy right now. Please wait about a minute and try again.",
          },
          { status: 429 }
        );
      }

      console.error(`AI plan attempt ${attempt} of ${MAX_ATTEMPTS} failed.`);
    }
  }

  console.error("AI plan failed on every attempt:", lastError);
  return Response.json(
    { error: "The planner couldn't build a plan just now. Please try again." },
    { status: 502 }
  );
}
