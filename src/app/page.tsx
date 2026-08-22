"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { TravelEvent } from "./events/types";
import Image from "next/image";
import Card from "@/components/Card";
import downtownAerial from "@/images/downtown-aerial.jpg";
import georgeStreet from "@/images/george-street.jpg";
import quidiVidi from "@/images/quidi-vidi.jpg";
import cityscape from "@/images/cityscape.jpg";
import MiniCalendar from "@/components/MiniCalendar";
import WeatherGlyph from "@/components/WeatherGlyph";
import { conditionFromLabel, conditionFromCode } from "@/lib/weatherIcons";

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

function show(value: number | null, suffix: string): string {
  return value === null ? "--" : `${value}${suffix}`;
}

// Three places worth sending a visitor to, each linking somewhere useful in
// the app rather than being decoration for its own sake.
const DISCOVER = [
  {
    title: "George Street",
    blurb: "Pubs, live music and most of the city's nightlife on one street.",
    alt: "Bars along George Street in St. John's",
    photo: georgeStreet,
    href: "/events",
  },
  {
    title: "Quidi Vidi",
    blurb: "A tiny fishing village tucked inside the city, right on the water.",
    alt: "Quidi Vidi village and its harbour",
    photo: quidiVidi,
    href: "/plan",
  },
  {
    title: "Around the city",
    blurb: "Harbour views, coloured houses and the hills above the Narrows.",
    alt: "A view across St. John's",
    photo: cityscape,
    href: "/plan",
  },
];

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
      <h2 className="font-display text-xl font-extrabold">{children}</h2>
    </div>
  );
}

function QuickFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
        {label}
      </span>
      <p className="mt-1.5 font-display text-2xl font-extrabold leading-none text-ink">
        {value}
      </p>
      {note ? <p className="mt-1 truncate text-xs text-fog">{note}</p> : null}
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

  // Reads as "Next on Friday" rather than repeating the raw date.
  let nextEventText = "Nothing booked yet";
  if (upcoming.length > 0) {
    const nextDay = new Date(`${upcoming[0].date}T00:00:00`);
    nextEventText = `Next ${nextDay.toLocaleDateString("en-CA", {
      weekday: "long",
    })}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* The photo is imported rather than linked by name, which lets Next
          work out its size, serve a smaller copy to phones, and show a blurred
          version while the real one downloads. */}
      <section className="relative mb-6 overflow-hidden rounded-3xl">
        <Image
          src={downtownAerial}
          alt="Downtown St. John's seen from above"
          placeholder="blur"
          priority
          className="h-52 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-nl-pink-100">
            Newfoundland and Labrador
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            St. John&apos;s Travel Advisory
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Today&apos;s weather, what&apos;s on around town, and a plan built
            around both.
          </p>
        </div>
        <div className="tricolour-bar absolute inset-x-0 bottom-0 h-1.5" />
      </section>

      {/* A quick read on the city before the detail below. Every number here
          comes from data the page has already fetched, so it costs nothing
          extra and it fills what used to be a gap under the banner. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickFact
          label="Right now"
          value={city ? show(city.temp, "°C") : "--"}
          note={city ? city.label : "Loading…"}
        />
        <QuickFact
          label="Feels like"
          value={city ? show(city.feelsLike, "°C") : "--"}
          note={city && city.humidity !== null ? `${city.humidity}% humidity` : ""}
        />
        <QuickFact
          label="Upcoming events"
          value={String(upcoming.length)}
          note={nextEventText}
        />
        <QuickFact
          label="Today's high"
          value={forecast.length > 0 ? `${forecast[0].high}°C` : "--"}
          note={forecast.length > 0 ? `Low ${forecast[0].low}°C` : ""}
        />
      </div>

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
                      <p className="flex items-center gap-1.5 text-lg font-semibold text-nl-pink-700">
                        {city && (
                          <WeatherGlyph
                            condition={conditionFromLabel(city.label)}
                            className="h-5 w-5"
                          />
                        )}
                        {city ? city.label : "Loading…"}
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
                  {/* This used to be "Vis.", but Environment Canada does not
                      send visibility in this feed, so the box was blank every
                      time. "Feels like" is a reading we actually receive. */}
                  <WeatherStat
                    label="Feels like"
                    value={city ? show(city.feelsLike, "°") : "--"}
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
                      <WeatherGlyph
                        condition={conditionFromCode(day.code)}
                        className="h-5 w-5 text-nl-green-700"
                      />
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

        <section>
          <SectionHeading>Discover St. John&apos;s</SectionHeading>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {DISCOVER.map((place) => (
              <Link key={place.title} href={place.href} className="group block">
                <Card className="h-full overflow-hidden">
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={place.photo}
                      alt={place.alt}
                      placeholder="blur"
                      className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-extrabold">
                      {place.title}
                    </h3>
                    <p className="mt-1 text-sm text-fog">{place.blurb}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        </div>

        <div className="space-y-6">
          <section>
            {/* The main column starts with a heading, so this one needs one
                too or the two columns start at different heights. */}
            <SectionHeading>Plan your trip</SectionHeading>
            <Link href="/plan" className="mt-3 block">
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
          </section>

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
                    <Link href={`/events/${event._id}`} className="block">
                      <Card className="flex items-center gap-3 p-3 transition-shadow hover:shadow-md">
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
                    </Link>
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