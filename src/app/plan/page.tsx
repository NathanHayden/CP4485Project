import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import PlanForm from "./PlanForm";

export const metadata = {
  title: "Plan my visit · St. John's Travel Advisory",
  description:
    "Build a day by day St. John's itinerary from our events calendar and the local forecast.",
};

export default async function PlanPage() {
  const session = (await cookies()).get("session");
  let firstName = "";

  if (session) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(session.value, secret);
      const name = payload.name ? (payload.name as string) : "";
      firstName = name.split(" ")[0];
    } catch {
      firstName = "";
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        <span className="text-tricolour">
          {firstName ? `Plan your visit, ${firstName}` : "Plan my visit"}
        </span>
      </h1>

      <p className="mt-4 text-nl-fog">
        Tell us when you&apos;re here and what you&apos;re into. We&apos;ll read the
        events already on our calendar, check the St. John&apos;s forecast, and put
        together a day by day plan.
      </p>

      <div className="mt-10">
        <PlanForm />
      </div>
    </div>
  );
}
