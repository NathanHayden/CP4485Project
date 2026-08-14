"use client";

import { useState } from "react";
import type { TravelEvent } from "@/app/events/types";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toYMD(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function MiniCalendar({ events }: { events: TravelEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayYMD = toYMD(today);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const eventDays = new Set(
    events
      .filter((event) => event.date.startsWith(monthPrefix))
      .map((event) => Number(event.date.slice(8, 10)))
  );

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  function goToMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold">
          {MONTHS[month]} {year}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="rounded-md border border-line-strong px-2 py-0.5 text-sm font-bold text-ink/70 hover:bg-hover"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="rounded-md border border-line-strong px-2 py-0.5 text-sm font-bold text-ink/70 hover:bg-hover"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold uppercase text-fog">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={index} />;
          }
          const ymd = `${monthPrefix}-${String(day).padStart(2, "0")}`;
          const isToday = ymd === todayYMD;
          const hasEvent = eventDays.has(day);
          return (
            <div
              key={index}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                isToday ? "bg-nl-green font-bold text-white" : "text-ink"
              }`}
            >
              {day}
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${
                  hasEvent
                    ? isToday
                      ? "bg-white"
                      : "bg-nl-pink-600"
                    : "bg-transparent"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}