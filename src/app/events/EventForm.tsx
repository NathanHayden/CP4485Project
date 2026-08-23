"use client";

import { useState, type FormEvent } from "react";
import { EVENT_CATEGORIES } from "./types";
import { validateEventInput, localTodayString } from "./validateEvent";
import Field, { fieldInputClass } from "@/components/Field";
import Button from "@/components/Button";
import LocationPicker from "@/components/map/LocationPicker";
import AddressSearchField from "@/components/map/AddressSearchField";
import type { AddressSuggestion } from "@/lib/geocode";

type EventFormValues = {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  url?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type EventFormProps = {
  action: string | ((formData: FormData) => void | Promise<void>);
  method?: "POST";
  defaultValues?: EventFormValues;
  hiddenId?: string;
  submitLabel: string;
  error?: string;
};

export default function EventForm({
  action,
  method,
  defaultValues = {},
  hiddenId,
  submitLabel,
  error,
}: EventFormProps) {
  const today = localTodayString();
  const [clientError, setClientError] = useState<string | null>(null);

  // The location text and the pin now live together up here, because picking
  // an address from the search box has to set both at once.
  const [location, setLocation] = useState(defaultValues.location ?? "");
  const [latitude, setLatitude] = useState<number | null>(
    defaultValues.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    defaultValues.longitude ?? null
  );

  // Set only when an address is chosen from the list. The map watches it and
  // moves there. Clicking the map to drop a pin deliberately does NOT touch
  // it, so the map never jumps out from under the pointer.
  const [centerOn, setCenterOn] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Saving an event is a full page post, which leaves a moment where the
  // button is still clickable and a second press would file it twice.
  const [submitting, setSubmitting] = useState(false);

  // Someone picked an address out of the suggestion list: fill the box, drop
  // the pin on it, and move the map to show it.
  function handlePickAddress(suggestion: AddressSuggestion) {
    setLocation(suggestion.label);
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setCenterOn({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  }

  // Someone clicked the map instead. Drop the pin, then ask what is at that
  // spot and write it into the location box so they do not have to type it.
  async function handlePickOnMap(newLatitude: number, newLongitude: number) {
    setLatitude(newLatitude);
    setLongitude(newLongitude);

    try {
      const res = await fetch(
        `/api/geocode/reverse?lat=${newLatitude}&lon=${newLongitude}`
      );
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data && data.label) {
        setLocation(data.label);
      }
    } catch (error) {
      // The pin is dropped and will still save. Only the typing help is
      // missing, so there is nothing worth interrupting anyone about.
      console.error("Could not look up the address for that pin:", error);
    }
  }

  function handleClearPin() {
    setLatitude(null);
    setLongitude(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);

    const validationError = validateEventInput({
      title: (formData.get("title") as string) ?? "",
      date: (formData.get("date") as string) ?? "",
      endDate: (formData.get("endDate") as string) ?? "",
      startTime: (formData.get("startTime") as string) ?? "",
      endTime: (formData.get("endTime") as string) ?? "",
      location: (formData.get("location") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
    });

    if (validationError) {
      e.preventDefault();
      setClientError(validationError);
      return;
    }

    setSubmitting(true);
  }

  const shownError = clientError ? clientError : error;

  return (
    <form
      action={action}
      method={typeof action === "string" ? method ?? "POST" : undefined}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {hiddenId && <input type="hidden" name="id" value={hiddenId} />}

      {shownError && (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm font-medium text-danger-text">
          {shownError}
        </p>
      )}

      {/* Two columns on a wide screen: the boxes to fill in on the left and
          the map on the right. It used to be one tall stack, which meant
          scrolling past everything to reach the map and back up again. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Field
            label="Event name"
            name="title"
            required
            defaultValue={defaultValues.title}
            placeholder="George Street Festival"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Start Date"
              name="date"
              type="date"
              required
              min={today}
              defaultValue={defaultValues.date}
            />
            <Field
              label="End date"
              name="endDate"
              type="date"
              min={today}
              defaultValue={defaultValues.endDate}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Start time"
              name="startTime"
              type="time"
              required
              defaultValue={defaultValues.startTime}
            />
            <Field
              label="End time"
              name="endTime"
              type="time"
              defaultValue={defaultValues.endTime}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Category">
              <select
                name="category"
                defaultValue={defaultValues.category ?? "Music"}
                className={fieldInputClass}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <AddressSearchField
              value={location}
              onChange={setLocation}
              onPick={handlePickAddress}
            />
          </div>

          <Field label="Details">
            <textarea
              name="description"
              rows={3}
              required
              defaultValue={defaultValues.description}
              placeholder="What's happening, what to expect, cost..."
              className={fieldInputClass}
            />
          </Field>

          <Field
            label="Link (optional)"
            name="url"
            type="url"
            defaultValue={defaultValues.url}
            placeholder="https://..."
          />
        </div>

        {/* Sticks to the top on a wide screen so the map stays in view while
            the boxes on the left are being filled in. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            centerOn={centerOn}
            onPick={handlePickOnMap}
            onClear={handleClearPin}
          />
        </div>
      </div>

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}