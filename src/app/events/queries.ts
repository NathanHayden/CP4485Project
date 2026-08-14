import "server-only";
import { ObjectId, type Document } from "mongodb";
import { connectToDB } from "@/app/api/db";
import type { TravelEvent, EventCategory } from "./types";

// Each event stores the id of the user who added it, but the display name and
// profile picture live over in the "users" collection. $lookup lets Mongo join
// the two in one round trip instead of us fetching every user separately.
const SUBMITTER_LOOKUP: Document[] = [
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "submitter",
    },
  },
  // $lookup always hands back an array. Flatten it to a single document, and
  // keep the event even when the user has since been deleted.
  {
    $unwind: { path: "$submitter", preserveNullAndEmptyArrays: true },
  },
];

function text(value: unknown): string {
  return value ? String(value) : "";
}

function toTravelEvent(doc: Document): TravelEvent {
  return {
    _id: doc._id.toString(),
    title: text(doc.title),
    description: text(doc.description),
    category: doc.category ? (doc.category as EventCategory) : "Other",
    location: text(doc.location),
    date: text(doc.date),
    endDate: text(doc.endDate),
    startTime: text(doc.startTime),
    endTime: text(doc.endTime),
    url: text(doc.url),
    submittedBy: text(doc.submittedBy),
    userId: doc.userId ? doc.userId.toString() : "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    submitter: doc.submitter
      ? {
          name: text(doc.submitter.name),
          picture: text(doc.submitter.picture),
        }
      : null,
  };
}

export async function getAllEvents(): Promise<TravelEvent[]> {
  const { db } = await connectToDB();

  const docs = await db
    .collection("events")
    .aggregate([...SUBMITTER_LOOKUP, { $sort: { date: 1, startTime: 1 } }])
    .toArray();

  return docs.map(toTravelEvent);
}

export async function getEventById(id: string): Promise<TravelEvent | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const { db } = await connectToDB();

  const docs = await db
    .collection("events")
    .aggregate([{ $match: { _id: new ObjectId(id) } }, ...SUBMITTER_LOOKUP])
    .toArray();

  if (docs.length === 0) {
    return null;
  }

  return toTravelEvent(docs[0]);
}
