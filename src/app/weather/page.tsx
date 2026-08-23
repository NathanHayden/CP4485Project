"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import skyline from "@/images/skyline-wide.jpg";
import { ST_JOHNS_CENTER } from "@/lib/map";
import WeatherGlyph from "@/components/WeatherGlyph";
import { conditionFromLabel, conditionFromCode } from "@/lib/weatherIcons";

// Environment Canada wraps most readings as { value: { en: "12" } } and most
// words as { en: "Partly Cloudy" }. This pulls the English value out of either
// shape and returns "" when the field is not in the reply at all. Several
// readings genuinely come and go with the season, so a missing one has to be
// normal rather than a crash.
function en(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const wrapped = node as {
    value?: { en?: string | number };
    en?: string | number;
  };

  if (wrapped.value && wrapped.value.en !== undefined && wrapped.value.en !== null) {
    return String(wrapped.value.en);
  }
  if (wrapped.en !== undefined && wrapped.en !== null) {
    return String(wrapped.en);
  }
  return "";
}

type Conditions = {
  cityName: string;
  temp: string;
  condition: string;
  feelsLike: string;
  humidity: string;
  windSpeed: string;
  windDirection: string;
  windGust: string;
  pressure: string;
  pressureTendency: string;
  dewpoint: string;
  station: string;
  observedAt: string;
  sunrise: string;
  sunset: string;
  normals: string;
  periods: ForecastPeriod[];
  warnings: string[];
};

// One of Environment Canada's written forecast periods, e.g. "Tonight" or
// "Friday". They give far more detail than a high and a low, which is the
// whole point of showing them.
type ForecastPeriod = {
  name: string;
  detail: string;
  temperature: string;
  humidity: string;
};

type AirQuality = {
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
};

type Extras = {
  visibility: number | null;
  cloudCover: number | null;
  precipitationNow: number | null;
  uvIndex: number | null;
  precipitationToday: number | null;
  daylightSeconds: number | null;
};

type HourlyEntry = {
  at: number;
  temp: number;
  rainChance: number | null;
  code: number;
  wind: number;
};

type ForecastDay = {
  date: string;
  high: number;
  low: number;
  code: number;
  rainChance: number | null;
  uvIndex: number | null;
};

// The European air quality index is a number nobody reads at a glance, so it
// is shown with the word that goes with it. The bands are the ones the index
// itself defines.
function airQualityWord(aqi: number): string {
  if (aqi <= 20) return "Good";
  if (aqi <= 40) return "Fair";
  if (aqi <= 60) return "Moderate";
  if (aqi <= 80) return "Poor";
  if (aqi <= 100) return "Very poor";
  return "Extremely poor";
}

// The heading of each forecast card already shows the temperature, and the
// paragraph underneath says it again. On most days that is a short repeat
// like "High 23." On a day with regional variation it is "High 21 except 25
// inland and where winds blow off the land", which is what made one card
// three times longer than the rest. The heading keeps it, so it comes out of
// the paragraph.
function tidyForecast(detail: string): string {
  const sentences = detail.split(". ");
  const kept: string[] = [];

  for (const sentence of sentences) {
    let trimmed = sentence.trim();

    if (trimmed.startsWith("High ") || trimmed.startsWith("Low ")) {
      continue;
    }

    // Environment Canada writes one forecast for the whole region, so several
    // sentences carry a note about somewhere else: "Humidex 25 except 27
    // inland and where winds blow off the land". This site is only about
    // St. John's, and that tail was most of what made one card run long.
    const exceptAt = trimmed.indexOf(" except ");
    if (exceptAt > 0) {
      trimmed = trimmed.slice(0, exceptAt);
    }

    if (trimmed !== "") {
      kept.push(trimmed);
    }
  }

  if (kept.length === 0) {
    return detail;
  }

  // Splitting on ". " takes the full stops off, so they go back on.
  return kept.join(". ").replace(/\.?$/, ".");
}

// 49873 seconds of daylight is not something anyone can picture, so it is
// shown as hours and minutes.
function hoursAndMinutes(seconds: number): string {
  const whole = Math.round(seconds / 60);
  return `${Math.floor(whole / 60)}h ${whole % 60}m`;
}

function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

// Turns one of Environment Canada's timestamps into a plain local clock time.
function clockTime(isoText: string): string {
  if (!isoText) {
    return "";
  }

  const when = new Date(isoText);
  if (Number.isNaN(when.getTime())) {
    return "";
  }

  return when.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

// The forecast is for St. John's, so the hours are labelled in St. John's
// time even when the person reading the page is somewhere else.
function hourLabel(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString("en-CA", {
    hour: "numeric",
    timeZone: "America/St_Johns",
  });
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold leading-none text-ink">
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-fog">{note}</p>}
    </div>
  );
}

export default function Weather() {
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourly, setHourly] = useState<HourlyEntry[]>([]);
  const [air, setAir] = useState<AirQuality | null>(null);
  const [extras, setExtras] = useState<Extras | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then(async (response) => {
        const data = await response.json();

        // The route answers with an { error } message when Environment Canada
        // is unreachable, so check that before reading the conditions.
        if (!response.ok || !data.properties) {
          throw new Error(
            data.error ? data.error : "The weather service is unavailable."
          );
        }

        const props = data.properties;
        const cc = props.currentConditions;
        const riseSet = props.riseSet ? props.riseSet : {};
        const wind = cc.wind ? cc.wind : {};

        // Humidex in summer, wind chill in winter, and neither on a mild day,
        // when "feels like" is simply the temperature.
        let feelsLike = en(cc.temperature);
        if (en(cc.humidex)) {
          feelsLike = en(cc.humidex);
        } else if (en(cc.windChill)) {
          feelsLike = en(cc.windChill);
        }

        // Environment Canada writes a paragraph for each upcoming period.
        // Pull out the parts worth showing and skip anything it left blank.
        const rawPeriods = props.forecastGroup && props.forecastGroup.forecasts
          ? props.forecastGroup.forecasts
          : [];
        const periods: ForecastPeriod[] = [];
        for (const entry of rawPeriods) {
          const name = entry.period ? en(entry.period.textForecastName) : "";
          if (!name) {
            continue;
          }

          // The short line only says something like "Mainly cloudy". The full
          // one is a proper paragraph with the chance of showers, the wind,
          // the humidex and the UV level all written out, which is the whole
          // reason for showing these at all. Wind and visibility used to be
          // read from their own fields, but those are filled in on barely one
          // period in thirteen, which is why one card looked detailed and the
          // rest looked empty.
          const detail = en(entry.textSummary);

          // The number on its own, rather than the sentence around it. The
          // sentence can run to "High 21 except 25 inland and where winds
          // blow off the land", which does not belong in a heading.
          let temperature = "";
          const readings =
            entry.temperatures && Array.isArray(entry.temperatures.temperature)
              ? entry.temperatures.temperature
              : [];
          if (readings.length > 0) {
            const kind = en(readings[0].class);
            const value = en(readings[0]);
            if (value) {
              temperature = `${kind === "low" ? "Low" : "High"} ${value}°`;
            }
          }

          periods.push({
            name,
            detail: tidyForecast(
              detail ? detail : en(entry.abbreviatedForecast?.textSummary)
            ),
            temperature,
            humidity: entry.relativeHumidity ? en(entry.relativeHumidity) : "",
          });
        }

        // Environment Canada sends an empty list when nothing is in effect,
        // which is the normal case, so the exact shape of a real warning could
        // not be checked against live data. Read it loosely and show nothing
        // rather than guess wrong: several field names are tried and anything
        // unrecognised is skipped.
        const warnings: string[] = [];
        const rawWarnings = Array.isArray(props.warnings) ? props.warnings : [];
        for (const entry of rawWarnings) {
          if (!entry || typeof entry !== "object") {
            continue;
          }
          const text =
            en(entry.eventType) ||
            en(entry.type) ||
            en(entry.description) ||
            en(entry.priority) ||
            en(entry.textSummary);
          if (text) {
            warnings.push(text);
          }
        }

        setConditions({
          cityName: en(props.name),
          temp: en(cc.temperature),
          condition: en(cc.condition),
          feelsLike,
          humidity: en(cc.relativeHumidity),
          windSpeed: en(wind.speed),
          windDirection: en(wind.direction),
          windGust: en(wind.gust),
          pressure: en(cc.pressure),
          pressureTendency:
            cc.pressure && cc.pressure.tendency ? en(cc.pressure.tendency) : "",
          dewpoint: en(cc.dewpoint),
          station: cc.station ? en(cc.station.code).toUpperCase() : "",
          observedAt: clockTime(en(cc.timestamp)),
          sunrise: clockTime(en(riseSet.sunrise)),
          sunset: clockTime(en(riseSet.sunset)),
          normals:
            props.forecastGroup && props.forecastGroup.regionalNormals
              ? en(props.forecastGroup.regionalNormals.textSummary)
              : "",
          periods,
          warnings,
        });
      })
      .catch((caught) => {
        console.error("Error fetching weather:", caught);
        setError(
          caught instanceof Error
            ? caught.message
            : "The weather service is unavailable."
        );
      })
      .finally(() => setLoading(false));

    // The week ahead comes from a different service, and it is not essential,
    // so a failure here only means the forecast strip stays empty.
    fetch(
      `/api/weather/forecast?lat=${ST_JOHNS_CENTER.latitude}&lon=${ST_JOHNS_CENTER.longitude}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setForecast(data);
        }
      })
      .catch((caught) => console.error("Failed to load forecast:", caught));

    // Also optional. An empty hourly list simply hides that strip.
    fetch("/api/weather/hourly")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHourly(data);
        }
      })
      .catch((caught) =>
        console.error("Failed to load the hourly forecast:", caught)
      );

    // Readings Environment Canada does not publish. Optional like the rest:
    // a failure just means those boxes are not there.
    fetch("/api/weather/extra")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setExtras(data);
        }
      })
      .catch((caught) =>
        console.error("Failed to load the extra readings:", caught)
      );

    // Also optional. Without it the two air quality boxes simply do not show.
    fetch("/api/weather/air")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.aqi === "number") {
          setAir(data);
        }
      })
      .catch((caught) =>
        console.error("Failed to load the air quality:", caught)
      );
  }, []);

  // Every tile is built here rather than written out in the markup, so a
  // reading Environment Canada did not send simply produces no tile. The page
  // used to show a "Visibility" box that was blank every single time, because
  // that reading is not in this feed at all.
  const stats: { label: string; value: string; note?: string }[] = [];

  if (conditions) {
    if (conditions.feelsLike) {
      const feelsValue = parseFloat(conditions.feelsLike);
      stats.push({
        label: "Feels like",
        value: isFahrenheit
          ? `${celsiusToFahrenheit(feelsValue)}°F`
          : `${Math.round(feelsValue)}°C`,
      });
    }

    if (conditions.humidity) {
      stats.push({
        label: "Humidity",
        value: `${conditions.humidity}%`,
      });
    }

    if (conditions.windSpeed) {
      stats.push({
        label: "Wind",
        value: isFahrenheit
          ? `${Math.round(parseFloat(conditions.windSpeed) * 0.621)} mph`
          : `${Math.round(parseFloat(conditions.windSpeed))} km/h`,
        note: conditions.windDirection
          ? `Out of the ${conditions.windDirection}`
          : undefined,
      });
    }

    if (conditions.windGust) {
      stats.push({
        label: "Gusting to",
        value: isFahrenheit
          ? `${Math.round(parseFloat(conditions.windGust) * 0.621)} mph`
          : `${Math.round(parseFloat(conditions.windGust))} km/h`,
      });
    }

    if (conditions.dewpoint) {
      const dew = parseFloat(conditions.dewpoint);
      stats.push({
        label: "Dew point",
        value: isFahrenheit
          ? `${celsiusToFahrenheit(dew)}°F`
          : `${Math.round(dew)}°C`,
      });
    }

    if (conditions.pressure) {
      const kilopascals = parseFloat(conditions.pressure);
      stats.push({
        label: "Pressure",
        value: isFahrenheit
          ? `${(kilopascals * 0.2953).toFixed(2)} inHg`
          : `${kilopascals.toFixed(1)} kPa`,
        note: conditions.pressureTendency
          ? `and ${conditions.pressureTendency}`
          : undefined,
      });
    }

    if (conditions.sunrise) {
      stats.push({ label: "Sunrise", value: conditions.sunrise });
    }

    if (conditions.sunset) {
      stats.push({ label: "Sunset", value: conditions.sunset });
    }
  }

  // Today's rain chance rounds the grid out and is the one thing a visitor
  // deciding what to do actually wants to know. It comes from the forecast
  // request rather than the current conditions, so it is added separately.
  if (extras && extras.visibility !== null) {
    const kilometres = extras.visibility / 1000;
    stats.push({
      label: "Visibility",
      value: isFahrenheit
        ? `${Math.round(kilometres * 0.621)} mi`
        : `${Math.round(kilometres)} km`,
    });
  }

  if (extras && extras.uvIndex !== null) {
    stats.push({
      label: "UV index",
      value: String(Math.round(extras.uvIndex)),
      note: extras.uvIndex >= 6 ? "Cover up outdoors" : "Low risk today",
    });
  }

  if (extras && extras.precipitationToday !== null) {
    stats.push({
      label: "Rain today",
      value: `${extras.precipitationToday.toFixed(1)} mm`,
      note:
        extras.precipitationNow !== null && extras.precipitationNow > 0
          ? "Falling now"
          : "None falling now",
    });
  }

  if (extras && extras.cloudCover !== null) {
    stats.push({
      label: "Cloud cover",
      value: `${Math.round(extras.cloudCover)}%`,
    });
  }

  if (extras && extras.daylightSeconds !== null) {
    stats.push({
      label: "Daylight",
      value: hoursAndMinutes(extras.daylightSeconds),
    });
  }

  if (air && air.aqi !== null) {
    stats.push({
      label: "Air quality",
      value: airQualityWord(air.aqi),
      note: `European index ${Math.round(air.aqi)}`,
    });
  }

  if (air && air.pm25 !== null) {
    stats.push({
      label: "Fine particles",
      value: `${air.pm25.toFixed(1)} µg/m³`,
      note: air.pm10 !== null ? `Coarse ${air.pm10.toFixed(1)}` : undefined,
    });
  }

  const todayForecast = forecast.length > 0 ? forecast[0] : null;
  if (todayForecast && todayForecast.rainChance !== null) {
    stats.push({
      label: "Rain chance today",
      value: `${todayForecast.rainChance}%`,
    });
  }

  // The cards sit in two columns, so an odd number leaves a gap at the end.
  // Environment Canada sends thirteen periods, and the last one is the
  // furthest away and the vaguest, so dropping it costs nothing.
  let shownPeriods: ForecastPeriod[] = [];
  if (conditions) {
    const count = conditions.periods.length;
    shownPeriods = conditions.periods.slice(0, count - (count % 2));
  }

  const temperature = conditions ? parseFloat(conditions.temp) : 0;
  const feels = conditions ? parseFloat(conditions.feelsLike) : 0;
  const bigTemp = isFahrenheit
    ? celsiusToFahrenheit(temperature)
    : Math.round(temperature);
  const feelsTemp = isFahrenheit ? celsiusToFahrenheit(feels) : Math.round(feels);
  const unit = isFahrenheit ? "°F" : "°C";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Photo banner with the reading laid over it, so the page opens with
          something to look at rather than a lone card on an empty screen. */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Behind the words, stretching to fit them. A fixed height here cut
            the temperature off on a narrow screen, where the name of the city
            and the °F button each take a line of their own. */}
        <Image
          src={skyline}
          alt="St. John's"
          placeholder="blur"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

        <div className="relative flex min-h-[18rem] flex-col justify-between gap-6 p-6 sm:min-h-[20rem] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-nl-pink-100">
                Right now in
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {conditions && conditions.cityName
                  ? conditions.cityName
                  : "St. John's"}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsFahrenheit((f) => !f)}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              {isFahrenheit ? "Show °C" : "Show °F"}
            </button>
          </div>

          {loading && (
            <p className="text-sm font-medium text-white/80">
              Loading current conditions…
            </p>
          )}

          {conditions && (
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div className="flex items-center gap-4">
                <WeatherGlyph
                  condition={conditionFromLabel(conditions.condition)}
                  className="h-14 w-14 text-white sm:h-16 sm:w-16"
                />
                <div>
                  <p className="font-display text-5xl font-extrabold leading-none text-white sm:text-7xl">
                    {bigTemp}
                    <span className="align-top text-2xl text-white/70">
                      {unit}
                    </span>
                  </p>
                  <p className="mt-1 text-base font-semibold text-white/90">
                    {conditions.condition}
                  </p>
                </div>
              </div>

              {conditions.feelsLike && (
                <p className="pb-1 text-sm font-medium text-white/80">
                  Feels like{" "}
                  <span className="font-extrabold text-white">
                    {feelsTemp}
                    {unit}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="tricolour-bar absolute inset-x-0 bottom-0 h-1.5" />
      </section>

      {conditions && conditions.warnings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-danger-border bg-danger-bg px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-danger-text">
            Weather warning in effect
          </p>
          <ul className="mt-1 space-y-1">
            {conditions.warnings.map((warning) => (
              <li key={warning} className="text-sm font-medium text-danger-text">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-danger-border bg-danger-bg px-4 py-3 text-center text-sm font-medium text-danger-text">
          {error} Please try again in a few minutes.
        </div>
      )}

      {stats.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
            <h2 className="font-display text-xl font-extrabold">
              Conditions in detail
            </h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>
      )}

      {hourly.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
            <h2 className="font-display text-xl font-extrabold">
              Next 24 hours
            </h2>
          </div>
          {/* Scrolls sideways rather than wrapping, so a full day fits on a
              phone without turning into six rows of boxes. */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {hourly.map((hour) => (
              <div
                key={hour.at}
                className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-3 text-center"
              >
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
                  {hourLabel(hour.at)}
                </span>
                <WeatherGlyph
                  condition={conditionFromCode(hour.code)}
                  className="h-5 w-5 text-nl-green-700"
                />
                <span className="text-sm font-extrabold text-ink">
                  {isFahrenheit ? celsiusToFahrenheit(hour.temp) : hour.temp}°
                </span>
                {hour.rainChance !== null && (
                  <span className="text-[0.65rem] text-fog">
                    {hour.rainChance}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {forecast.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
            <h2 className="font-display text-xl font-extrabold">
              The week ahead
            </h2>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {forecast.map((day) => {
              const when = new Date(`${day.date}T00:00:00`);
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-3 text-center"
                >
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
                    {when.toLocaleDateString("en-CA", { weekday: "short" })}
                  </span>
                  <WeatherGlyph
                    condition={conditionFromCode(day.code)}
                    className="h-6 w-6 text-nl-green-700"
                  />
                  <span className="text-sm font-extrabold text-ink">
                    {isFahrenheit ? celsiusToFahrenheit(day.high) : day.high}°
                  </span>
                  <span className="text-xs text-fog">
                    {isFahrenheit ? celsiusToFahrenheit(day.low) : day.low}°
                  </span>
                  {day.rainChance !== null && (
                    <span className="mt-1 border-t border-line pt-1 text-[0.65rem] text-fog">
                      {day.rainChance}% rain
                    </span>
                  )}
                  {day.uvIndex !== null && (
                    <span className="text-[0.65rem] text-fog">
                      UV {Math.round(day.uvIndex)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {conditions && shownPeriods.length > 0 && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-nl-pink-600" />
              <h2 className="font-display text-xl font-extrabold">
                Detailed forecast
              </h2>
            </div>
            {conditions.normals && (
              <p className="text-xs text-fog">
                Normal for this time of year: {conditions.normals}
              </p>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {shownPeriods.map((period) => (
              <div
                key={period.name}
                className="flex flex-col rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-base font-extrabold text-ink">
                    {period.name}
                  </h3>
                  {period.temperature && (
                    <span className="shrink-0 text-sm font-bold text-nl-green-700">
                      {period.temperature}
                    </span>
                  )}
                </div>

                {/* A minimum of about three lines, so a one line forecast and
                    a three line one take the same room and the cards in a row
                    end up the same height. */}
                {period.detail && (
                  <p className="mt-1.5 min-h-[4rem] flex-1 text-sm leading-relaxed text-ink/80">
                    {period.detail}
                  </p>
                )}

                {period.humidity && (
                  <p className="mt-3 border-t border-line pt-2 text-xs text-fog">
                    Humidity around {period.humidity}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface-muted px-5 py-4">
        <p className="text-sm text-fog">
          Readings from Environment Canada
          {conditions && conditions.station
            ? `, station ${conditions.station}`
            : ""}
          {conditions && conditions.observedAt
            ? `, taken at ${conditions.observedAt}`
            : ""}
          . The week ahead comes from Open-Meteo.
        </p>
        <Link
          href="/plan"
          className="shrink-0 text-sm font-bold text-nl-green-700 hover:underline"
        >
          Plan a trip around this →
        </Link>
      </div>
    </div>
  );
}
