import "server-only";
import { groq } from "@ai-sdk/groq";

// The model is fixed by the assignment brief, so it is named in one place
// instead of being repeated at every call site.
export const PLANNER_MODEL_ID = "openai/gpt-oss-20b";

export function plannerModel() {
  return groq(PLANNER_MODEL_ID);
}

// gpt-oss-20b spends its whole output budget on reasoning and returns an empty
// generation unless reasoning is turned down, so these settings travel with the
// model rather than living at the call site. Do not remove them.
export const PLANNER_PROVIDER_OPTIONS = {
  groq: { reasoningEffort: "low", reasoningFormat: "hidden" },
};

export const PLANNER_MAX_OUTPUT_TOKENS = 4000;

// The model occasionally breaks the schema on longer trips, and asking again
// usually produces a clean plan.
export const MAX_ATTEMPTS = 3;
