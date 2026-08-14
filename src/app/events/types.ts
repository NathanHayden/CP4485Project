// Filled in by the $lookup against the users collection. Null when the event's
// author no longer has an account.
export type EventSubmitter = {
  name: string;
  picture: string;
};

export type TravelEvent = {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  url: string;
  submittedBy: string;
  userId: string;
  createdAt: string;
  submitter: EventSubmitter | null;
};

export const EVENT_CATEGORIES = [
  "Music",
  "Food & Drink",
  "Festival",
  "Outdoors",
  "Arts",
  "Community",
  "Sports",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
