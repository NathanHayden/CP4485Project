import "server-only";
import { NoObjectGeneratedError } from "ai";
import { MAX_ATTEMPTS } from "./model";

// The AI SDK throws either a single API error with a statusCode on it, or a
// retry error that holds the underlying attempts in an "errors" array. This
// gathers the status codes out of both shapes.
function getStatusCodes(error: unknown): number[] {
  const codes: number[] = [];

  if (!error || typeof error !== "object") {
    return codes;
  }

  const outer = error as { statusCode?: number; errors?: unknown[] };
  if (typeof outer.statusCode === "number") {
    codes.push(outer.statusCode);
  }

  if (Array.isArray(outer.errors)) {
    outer.errors.forEach((attempt) => {
      if (attempt && typeof attempt === "object") {
        const inner = attempt as { statusCode?: number };
        if (typeof inner.statusCode === "number") {
          codes.push(inner.statusCode);
        }
      }
    });
  }

  return codes;
}

export function isRateLimited(error: unknown): boolean {
  return getStatusCodes(error).includes(429);
}

// Two different things can go wrong when the model writes the plan, and they
// need unpacking in different ways:
//
//   - NoObjectGeneratedError means the SDK got the text back but could not turn
//     it into our object. It carries the raw text, so we log that.
//   - Groq also checks the JSON against the schema on its own side and answers
//     with a 400 instead. That arrives as an ordinary API error whose message
//     names the exact field that broke, e.g. "'/days/6' does not validate".
//
// Either way we want the short reason in the log, not a hundred lines of dump.
export function logAttemptFailure(attempt: number, error: unknown) {
  console.error(`AI plan attempt ${attempt} of ${MAX_ATTEMPTS} failed.`);

  if (NoObjectGeneratedError.isInstance(error)) {
    console.error("  cause:", error.cause);
    console.error("  usage:", error.usage);
    console.error("  the model wrote:", error.text);
    return;
  }

  console.error("  reason:", error instanceof Error ? error.message : error);
}
