import "server-only";
import { generateObject } from "ai";
import { travelPlanSchema, type TravelPlan } from "@/app/plan/schema";
import {
  plannerModel,
  PLANNER_PROVIDER_OPTIONS,
  PLANNER_MAX_OUTPUT_TOKENS,
  MAX_ATTEMPTS,
} from "./model";
import { isRateLimited, logAttemptFailure } from "./errors";

// Everything the prompt needs. The route gathers these from Mongo, the weather
// API and the session cookie; this module only turns them into words.
export type PlanInputs = {
  startDate: string;
  endDate: string;
  tripLength: number;
  interests: string[];
  travellingWith: string;
  pace: string;
  notes: string;
  visitorName: string;
  forecast: string;
  calendarEvents: string;
};

// The route maps each of these onto an HTTP response. Keeping them as plain
// values means this module never has to know about Response or status codes.
export type PlanOutcome =
  | { status: "ok"; plan: TravelPlan }
  | { status: "rate-limited" }
  | { status: "failed" };

export function buildPlannerPrompt(inputs: PlanInputs): string {
  const greeting = inputs.visitorName
    ? `The visitor is signed in and their name is ${inputs.visitorName}. Address them by name in the overview.`
    : "The visitor is not signed in, so keep the tone welcoming but general.";

  return `You are a local travel advisor for St. John's, Newfoundland and Labrador, Canada.

Build a day by day plan for a visitor.

VISITOR
${greeting}
Arriving: ${inputs.startDate}
Leaving: ${inputs.endDate}
Trip length: ${inputs.tripLength} day(s)
Interests: ${inputs.interests.join(", ")}
Travelling as: ${inputs.travellingWith}
Preferred pace: ${inputs.pace}
Extra notes from the visitor: ${inputs.notes ? inputs.notes : "(none)"}

EVENTS ON OUR SITE'S CALENDAR DURING THE TRIP
${inputs.calendarEvents}

WEATHER FORECAST FOR ST. JOHN'S
${inputs.forecast}

RULES
1. Create exactly one entry in "days" for every date from ${inputs.startDate} to ${inputs.endDate} inclusive, in order.
2. Prefer the real calendar events above when they match the visitor's interests. When you use one, copy its name, set fromCalendar to true and put its id in eventId.
3. You may add your own well known St. John's suggestions (Signal Hill, Cape Spear, Quidi Vidi, The Rooms, Jellybean Row, George Street, Petty Harbour and similar) to fill the gaps. For those set fromCalendar to false and leave eventId as an empty string.
4. Never invent a calendar event that is not listed above.
5. Match the pace: Relaxed means 2 activities a day, Balanced means 3, Packed means 4.
6. Use the forecast. Put indoor activities on wet or foggy days and outdoor ones on clear days, and say so in weatherNote and in the reason.
7. matchScore is 1 to 100 and reflects how well the activity fits the stated interests.`;
}

// The model sometimes marks an activity as coming from our calendar but gives
// an id we never sent it. Those would turn into dead links on the results page,
// so we downgrade them to plain suggestions.
export function dropUnknownEventIds(
  plan: TravelPlan,
  validIds: Set<string>
): TravelPlan {
  const days = plan.days.map((day) => {
    const activities = day.activities.map((activity) => {
      if (activity.fromCalendar && validIds.has(activity.eventId)) {
        return activity;
      }
      return { ...activity, fromCalendar: false, eventId: "" };
    });
    return { ...day, activities };
  });

  return { ...plan, days };
}

export async function generateTravelPlan(
  inputs: PlanInputs,
  validEventIds: Set<string>
): Promise<PlanOutcome> {
  const prompt = buildPlannerPrompt(inputs);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await generateObject({
        model: plannerModel(),
        schema: travelPlanSchema,
        schemaName: "travel_plan",
        schemaDescription: "A day by day travel plan for St. John's.",
        maxOutputTokens: PLANNER_MAX_OUTPUT_TOKENS,
        // We do our own retrying below, so the SDK should not also retry and
        // spend a second call's worth of tokens behind our back.
        maxRetries: 0,
        providerOptions: PLANNER_PROVIDER_OPTIONS,
        prompt,
      });

      return {
        status: "ok",
        plan: dropUnknownEventIds(result.object, validEventIds),
      };
    } catch (error) {
      // Trying again straight away would only burn more of the token budget,
      // so stop and let the caller tell the visitor to come back in a moment.
      if (isRateLimited(error)) {
        console.error(
          "AI plan hit the Groq rate limit:",
          error instanceof Error ? error.message : error
        );
        return { status: "rate-limited" };
      }

      logAttemptFailure(attempt, error);
    }
  }

  console.error("AI plan failed on every attempt.");
  return { status: "failed" };
}
