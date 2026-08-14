import Link from "next/link";
import Card from "@/components/Card";
import type { TravelPlan, PlanActivity } from "./schema";

const TIME_ICON: Record<string, string> = {
  Morning: "🌅",
  Afternoon: "☀️",
  Evening: "🌙",
};

const TIME_ORDER: Record<string, number> = {
  Morning: 0,
  Afternoon: 1,
  Evening: 2,
};

function byTimeOfDay(first: PlanActivity, second: PlanActivity): number {
  return TIME_ORDER[first.timeOfDay] - TIME_ORDER[second.timeOfDay];
}

function scoreColour(score: number): string {
  if (score >= 80) {
    return "bg-nl-green-50 text-nl-green-700";
  }
  if (score >= 55) {
    return "bg-nl-pink-50 text-nl-pink-700";
  }
  return "bg-black/5 text-nl-fog";
}

function longDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Activity({ activity }: { activity: PlanActivity }) {
  const icon = TIME_ICON[activity.timeOfDay] ? TIME_ICON[activity.timeOfDay] : "📍";

  return (
    <li className="rounded-xl border border-black/5 bg-nl-cream p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-nl-fog">
            {icon} {activity.timeOfDay}
          </p>
          <h4 className="mt-1 font-display text-lg font-extrabold text-nl-ink">
            {activity.name}
          </h4>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${scoreColour(activity.matchScore)}`}
        >
          {Math.round(activity.matchScore)}% match
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-nl-green-50 px-2.5 py-0.5 text-xs font-semibold text-nl-green-700">
          {activity.category}
        </span>

        {activity.fromCalendar ? (
          <Link
            href="/events"
            className="rounded-full bg-nl-pink-100 px-2.5 py-0.5 text-xs font-semibold text-nl-pink-700 hover:underline"
          >
            ★ On our calendar
          </Link>
        ) : (
          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-nl-fog">
            Local suggestion
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-nl-ink/80">{activity.description}</p>

      <p className="mt-2 border-l-2 border-nl-pink pl-3 text-sm italic text-nl-fog">
        {activity.reason}
      </p>
    </li>
  );
}

export default function PlanResult({ plan }: { plan: TravelPlan }) {
  return (
    <div className="animate-float-up space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-nl-green-100 via-white to-nl-pink-100 p-6">
          <h2 className="font-display text-3xl font-extrabold text-nl-ink">
            {plan.tripTitle}
          </h2>
          <p className="mt-3 text-sm text-nl-ink/80">{plan.overview}</p>

          <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm ring-1 ring-black/5">
            <span className="font-bold text-nl-green-700">Before you pack — </span>
            {plan.packingTip}
          </p>
        </div>
        <div className="tricolour-bar h-1.5 w-full" />
      </Card>

      {plan.days.map((day, index) => (
        <Card key={day.date} className="p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-nl-pink-700">
                Day {index + 1} · {longDate(day.date)}
              </p>
              <h3 className="mt-1 font-display text-2xl font-extrabold">
                {day.dayTitle}
              </h3>
            </div>
          </div>

          <p className="mt-3 rounded-lg bg-nl-green-50 px-3 py-2 text-sm text-nl-green-900">
            {day.weatherNote}
          </p>

          <ul className="mt-4 space-y-3">
            {[...day.activities]
              .sort(byTimeOfDay)
              .map((activity, activityIndex) => (
                <Activity key={activityIndex} activity={activity} />
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
