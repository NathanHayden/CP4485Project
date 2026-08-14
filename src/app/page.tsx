"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { TravelEvent } from "./events/types";
import Card from "@/components/Card";
import MiniCalendar from "@/components/MiniCalendar";

type Condition = "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "foggy";

type City = {
  name: string;
  region: string;
  lon: number | null;
  lat: number | null;
  temp: number | null;
  feelsLike: number | null;
  label: string;
  wind: number | null;
  humidity: number | null;
  visibility: number | null;
};

type ForecastDay = {
  date: string;
  high: number;
  low: number;
  code: number;
};

const CONDITION_ICON: Record<Condition, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  windy: "💨",
  foggy: "🌫️",
};

function conditionFromLabel(label: string): Condition {
  const text = label.toLowerCase();
  if (text.includes("fog")) return "foggy";
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) return "rainy";
  if (text.includes("snow") || text.includes("flurr")) return "snowy";
  if (text.includes("wind") || text.includes("breez")) return "windy";
  if (text.includes("sun") || text.includes("clear")) return "sunny";
  return "cloudy";
}

function conditionFromCode(code: number): Condition {
  if (code === 0 || code === 1) return "sunny";
  if (code === 45 || code === 48) return "foggy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rainy";
  return "cloudy";
}

function show(value: number | null, suffix: string): string {
  return value === null ? "--" : `${value}${suffix}`;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
      <h2 className="font-display text-xl font-extrabold">{children}</h2>
    </div>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-surface/70 px-3 py-2 ring-1 ring-line">
      <span className="font-mono text-sm font-medium text-ink">{value}</span>
      <span className="text-[0.65rem] uppercase tracking-wider text-fog">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [events, setEvents] = useState<TravelEvent[]>([]);

  useEffect(() => {
    fetch("/api/weather/nearby")
      .then((res) => res.json())
      .then((data: City[]) => setCities(data))
      .catch((err) => console.error("Failed to load weather:", err));

    fetch("/api/events")
      .then((res) => res.json())
      .then((data: TravelEvent[]) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err));
  }, []);

  const city = cities.find((item) => item.name === "St. John's") ?? cities[0] ?? null;
  const lat = city ? city.lat : null;
  const lon = city ? city.lon : null;

  useEffect(() => {
    if (lat === null || lon === null) {
      return;
    }
    fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data: ForecastDay[]) => setForecast(data))
      .catch((err) => console.error("Failed to load forecast:", err));
  }, [lat, lon]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <SectionHeading>Current Conditions</SectionHeading>

            <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-nl-green-100 via-white to-nl-pink-100 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-nl-green-700">
                    {city ? city.region : "Loading…"}
                  </p>
                  <h3 className="mt-1 font-display text-3xl font-extrabold text-nl-ink">
                    {city ? city.name : "St. John's"}
                  </h3>
                  <div className="mt-2 flex items-end gap-4">
                    <span className="font-display text-6xl font-extrabold leading-none text-nl-green-900">
                      {city ? show(city.temp, "°") : "--°"}
                    </span>
                    <div className="pb-1">
                      <p className="text-lg font-semibold text-nl-pink-700">
                        {city
                          ? `${CONDITION_ICON[conditionFromLabel(city.label)]} ${city.label}`
                          : "Loading…"}
                      </p>
                      {city && city.feelsLike !== null && (
                        <p className="text-sm text-nl-fog">
                          Feels like {city.feelsLike}°C
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <WeatherStat
                    label="Wind"
                    value={city ? show(city.wind, " km/h") : "--"}
                  />
                  <WeatherStat
                    label="Humidity"
                    value={city ? show(city.humidity, "%") : "--"}
                  />
                  <WeatherStat
                    label="Vis."
                    value={city ? show(city.visibility, " km") : "--"}
                  />
                </div>
              </div>
              <div className="tricolour-bar h-1.5 w-full" />
            </div>
          </section>

          {forecast.length > 0 && (
            <section>
              <SectionHeading>7-Day Forecast — St. John&apos;s</SectionHeading>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {forecast.map((day) => {
                  const date = new Date(`${day.date}T00:00:00`);
                  return (
                    <Card
                      key={day.date}
                      className="flex flex-col items-center gap-1 p-2 text-center"
                    >
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
                        {date.toLocaleDateString("en-CA", { weekday: "short" })}
                      </span>
                      <span className="text-lg">
                        {CONDITION_ICON[conditionFromCode(day.code)]}
                      </span>
                      <span className="text-sm font-bold">{day.high}°</span>
                      <span className="text-xs text-fog">{day.low}°</span>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <Link
            href="/weather"
            className="inline-block text-sm font-bold text-nl-green-700 hover:underline"
          >
            Full weather →
          </Link>
        </div>

        <div className="space-y-6">
          <Link href="/plan" className="block">
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="bg-gradient-to-br from-nl-green-100 via-white to-nl-pink-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-nl-green-700">
                  Trip planner
                </p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-nl-ink">
                  Plan my visit
                </h3>
                <p className="mt-2 text-sm text-nl-fog">
                  A day by day itinerary built from our events calendar and the
                  local forecast.
                </p>
                <span className="mt-3 inline-block text-sm font-bold text-nl-green-700">
                  Build my plan →
                </span>
              </div>
              <div className="tricolour-bar h-1.5 w-full" />
            </Card>
          </Link>

          <section>
            <div className="flex items-center justify-between">
              <SectionHeading>Events Calendar</SectionHeading>
              <Link
                href="/events"
                className="text-xs font-bold text-nl-green-700 hover:underline"
              >
                Full calendar →
              </Link>
            </div>
            <div className="mt-3">
              <MiniCalendar events={events} />
            </div>
          </section>

          <section>
            <SectionHeading>Upcoming Events</SectionHeading>
            <ul className="mt-3 space-y-2">
              {upcoming.length === 0 && (
                <li className="text-sm text-fog">No upcoming events yet.</li>
              )}
              {upcoming.map((event) => {
                const day = new Date(`${event.date}T00:00:00`);
                return (
                  <li key={event._id}>
                    <Card className="flex items-center gap-3 p-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-nl-green-50 text-nl-green-700">
                        <span className="text-[0.55rem] font-bold uppercase">
                          {day.toLocaleDateString("en-CA", { month: "short" })}
                        </span>
                        <span className="text-base font-extrabold leading-none">
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {event.title}
                        </p>
                        <p className="truncate text-xs text-fog">
                          {event.location}
                        </p>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}