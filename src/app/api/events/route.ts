import { connectToDB } from "@/app/api/db";
import { revalidatePath } from "next/cache";
import { getAllEvents } from "@/app/events/queries";
import { validateEventInput } from "@/app/events/validateEvent";
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  // Shared with the events pages so both go through the same $lookup join.
  const events = await getAllEvents();
  return Response.json(events);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(session.value, secret));
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const endDate = formData.get("endDate") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;

  const error = validateEventInput({
    title,
    date,
    endDate,
    startTime,
    endTime,
    location,
    description,
  });
  if (error) {
    return Response.redirect(
      new URL(`/events/add?error=${encodeURIComponent(error)}`, request.url),
      303
    );
  }

  // Attribution comes from the signed-in user, not a free-text field, so it
  // can't be spoofed to look like it was added by someone else.
  const submittedBy =
    (payload.name as string) || (payload.email as string) || "";

  const { db } = await connectToDB();

  await db.collection("events").insertOne({
    title,
    description: formData.get("description"),
    category: formData.get("category"),
    location: formData.get("location"),
    date,
    endDate,
    startTime,
    endTime,
    url: formData.get("url"),
    submittedBy,
    userId: new ObjectId(payload.userId as string),
    createdAt: new Date(),
  });

  revalidatePath("/events");
  return Response.redirect(new URL("/events", request.url), 303);
}
