"use client";

import { useState, type FormEvent } from "react";
import { EVENT_CATEGORIES } from "@/app/events/types";
import { localTodayString } from "@/app/events/validateEvent";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Field, { fieldInputClass } from "@/components/Field";
import PlanResult from "./PlanResult";
import {
  TRAVEL_PARTIES,
  TRIP_PACES,
  MAX_TRIP_DAYS,
  type TravelPlan,
} from "./schema";

export default function PlanForm() {
  const today = localTodayString();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [interests, setInterests] = useState<string[]>(["Music", "Food & Drink"]);
  const [travellingWith, setTravellingWith] = useState<string>(TRAVEL_PARTIES[0]);
  const [pace, setPace] = useState<string>(TRIP_PACES[1]);
  const [notes, setNotes] = useState("");

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInterest(category: string) {
    if (interests.includes(category)) {
      setInterests(interests.filter((item) => item !== category));
    } else {
      setInterests([...interests, category]);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (interests.length === 0) {
      setError("Pick at least one interest.");
      return;
    }

    if (endDate < startDate) {
      setError("Your departure date can't be before your arrival date.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          interests,
          travellingWith,
          pace,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ? data.error : "Something went wrong.");
      } else {
        setPlan(data as TravelPlan);
      }
    } catch {
      setError("Couldn't reach the planner. Check your connection and try again.");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm font-medium text-danger-text">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Arriving">
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldInputClass}
              />
            </Field>

            <Field label="Leaving">
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldInputClass}
              />
            </Field>
          </div>

          <Field label={`What are you into? (up to ${MAX_TRIP_DAYS} days)`}>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((category) => {
                const selected = interests.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleInterest(category)}
                    className={
                      selected
                        ? "rounded-full bg-nl-green px-4 py-2 text-sm font-bold text-white"
                        : "rounded-full bg-hover px-4 py-2 text-sm font-semibold text-fog hover:opacity-80"
                    }
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Travelling as">
              <select
                value={travellingWith}
                onChange={(e) => setTravellingWith(e.target.value)}
                className={fieldInputClass}
              >
                {TRAVEL_PARTIES.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pace">
              <select
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                className={fieldInputClass}
              >
                {TRIP_PACES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Anything else we should know? (optional)">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Travelling with a toddler, no car, love seafood..."
              className={fieldInputClass}
            />
          </Field>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Building your plan…" : "Build my plan"}
          </Button>
        </form>
      </Card>

      {loading && (
        <Card className="p-6 text-center">
          <p className="font-display text-lg font-extrabold">
            Checking the calendar and the forecast…
          </p>
          <p className="mt-1 text-sm text-fog">
            This usually takes a few seconds.
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-hover">
            <div className="tricolour-bar animate-splash-bar h-full" />
          </div>
        </Card>
      )}

      {plan && <PlanResult plan={plan} />}
    </div>
  );
}
