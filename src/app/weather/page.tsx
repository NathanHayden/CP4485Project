"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import TricolourBar from "@/components/TricolourBar";

export default function Weather() {
  const [cityName, setCityName] = useState("");
  const [temp, setTemp] = useState("");
  const [condition, setCondition] = useState("");
  const [humidity, setHumidity] = useState("");
  const [wind, setWind] = useState("");
  const [icon, setIcon] = useState("");
  const [feelsLike, setFeelsLike] = useState("");
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      "/api/weather"
    )
      .then((response) => response.json())
      .then((data) => {
        const props = data.properties;
        const cc = props.currentConditions;

        setCityName(props.name.en);
        setTemp(cc.temperature.value.en);
        setCondition(cc.condition.en);
        setHumidity(cc.relativeHumidity.value.en);
        setWind(cc.wind.speed.value.en);
        setIcon(cc.iconCode.url);

        const calculatedFeels = cc.humidex
          ? cc.humidex.value.en
          : cc.windChill
          ? cc.windChill.value.en
          : cc.temperature.value.en;
        setFeelsLike(calculatedFeels);
      })
      .catch((error) => console.error("Error fetching weather:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="aurora min-h-[70vh]">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 text-center">
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {cityName ? `${cityName} Weather` : "St. John's Weather"}
          </h1>
        </div>

        <div className="relative w-full max-w-md animate-float-up overflow-hidden rounded-3xl border border-black/5 bg-surface shadow-xl">
          <TricolourBar className="h-1.5 w-full" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsFahrenheit(f => !f)}
                className="inline-flex items-center gap-2 rounded-full border border-nl-pink-200 bg-nl-pink-50 px-2 py-1.5 text-xs font-bold text-nl-pink-700 transition hover:bg-nl-pink-100"
              >
                {isFahrenheit ? "Switch to Metric (°C)" : "Switch to Imperial (°F)"}
              </button>
              <span className="text-md font-semibold uppercase tracking-wider text-fog">
                St. John&apos;s, NL
              </span>
            </div>

                {loading && (
                  <p className="mt-6 text-center text-sm text-fog">
                    Loading current conditions…
                  </p>
                )}

                {icon && (
                  <div className="mt-6 flex items-center justify-center gap-5">
                    <Image
                      src={icon}
                      alt={condition}
                      width={80}
                      height={68}
                      unoptimized
                      className="h-17 w-20"
                    />
                    <div>
                      <h2 className="font-display text-5xl font-extrabold leading-none tracking-tight">
                        {isFahrenheit ? Math.round(parseInt(temp) * 9/5 + 32) : parseInt(temp)}
                        <span className="align-top text-2xl text-fog"> {isFahrenheit ? "°F" : "°C"}</span>
                      </h2>
                      <p className="mt-1 text-sm font-medium text-fog">
                        {condition}
                      </p>
                    </div>
                  </div>
                )}

                {feelsLike && (
                  <div className="mt-6 rounded-2xl bg-gradient-to-r from-nl-green-50 to-nl-pink-50 p-3.5 text-center text-sm text-nl-ink">
                    Feels like{" "}
                    <span className="font-extrabold text-nl-green-700">
                      {isFahrenheit ? Math.round(parseInt(feelsLike) * 9/5 + 32) : parseInt(feelsLike)}°{isFahrenheit ? "F" : "C"}
                    </span>{" "}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-muted p-4">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
                      Humidity
                    </span>
                    <span className="text-lg font-extrabold text-ink">
                      {humidity}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface-muted p-4">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-fog">
                      Wind Speed
                    </span>
                    <span className="text-lg font-extrabold text-ink">
                      {isFahrenheit ? Math.round(parseFloat(wind) * 0.621) : parseInt(wind)} {isFahrenheit ? "mph" : "km/h"}
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
  );
}
