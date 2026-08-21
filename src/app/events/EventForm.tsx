"use client";

import { useState, type FormEvent } from "react";
import { EVENT_CATEGORIES } from "./types";
import { validateEventInput, localTodayString } from "./validateEvent";
import Field, { fieldInputClass } from "@/components/Field";
import Button from "@/components/Button";
import LocationPicker from "@/components/map/LocationPicker";

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
    }
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

        <Field
          label="Location"
          name="location"
          required
          defaultValue={defaultValues.location}
          placeholder="George Street, St. John's"
        />
      </div>

      <LocationPicker
        defaultLatitude={defaultValues.latitude ?? null}
        defaultLongitude={defaultValues.longitude ?? null}
      />

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

      <Button type="submit" fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
}