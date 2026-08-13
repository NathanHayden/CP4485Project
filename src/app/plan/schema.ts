import { z } from "zod";
import { EVENT_CATEGORIES } from "@/app/events/types";

export const TRAVEL_PARTIES = [
  "Solo",
  "Couple",
  "Family with kids",
  "Group of friends",
] as const;

export const TRIP_PACES = ["Relaxed", "Balanced", "Packed"] as const;

export const MAX_TRIP_DAYS = 7;

export const planRequestSchema = z.object({
  startDate: z.string().min(1, "Please choose an arrival date."),
  endDate: z.string().min(1, "Please choose a departure date."),
  interests: z.array(z.enum(EVENT_CATEGORIES)).min(1, "Pick at least one interest."),
  travellingWith: z.enum(TRAVEL_PARTIES),
  pace: z.enum(TRIP_PACES),
  notes: z.string(),
});

export type PlanRequest = z.infer<typeof planRequestSchema>;

const activitySchema = z.object({
  name: z.string().describe("Short name of the activity or event."),
  category: z
    .enum(EVENT_CATEGORIES)
    .describe("Which category this activity best fits into."),
  timeOfDay: z
    .enum(["Morning", "Afternoon", "Evening"])
    .describe("Roughly when in the day this should happen."),
  description: z
    .string()
    .describe("One or two sentences on what the visitor will actually do."),
  reason: z
    .string()
    .describe(
      "Why this suits THIS visitor. Mention their interests, who they are travelling with, or the weather that day."
    ),
  matchScore: z
    .number()
    .describe("How well this fits the visitor's stated interests, from 1 to 100."),
  fromCalendar: z
    .boolean()
    .describe(
      "True only if this is one of the real events supplied from the site's calendar. False for your own suggestions."
    ),
  eventId: z
    .string()
    .describe(
      "The id of the calendar event when fromCalendar is true, otherwise an empty string."
    ),
});

const planDaySchema = z.object({
  date: z.string().describe("The date of this day in YYYY-MM-DD format."),
  dayTitle: z
    .string()
    .describe("A short theme for the day, e.g. 'Harbour and history'."),
  weatherNote: z
    .string()
    .describe("One sentence on how that day's forecast shapes the plan."),
  activities: z
    .array(activitySchema)
    .describe("Two to four activities for this day, in time order."),
});

export const travelPlanSchema = z.object({
  tripTitle: z.string().describe("A short, friendly title for the whole trip."),
  overview: z
    .string()
    .describe("A two or three sentence summary of the trip you have planned."),
  packingTip: z
    .string()
    .describe("One practical packing or preparation tip based on the forecast."),
  days: z
    .array(planDaySchema)
    .describe("One entry per day of the trip, in date order."),
});

export type TravelPlan = z.infer<typeof travelPlanSchema>;
export type PlanDay = z.infer<typeof planDaySchema>;
export type PlanActivity = z.infer<typeof activitySchema>;
