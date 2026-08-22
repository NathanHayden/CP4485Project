// Shared between the home dashboard and the weather page. Both need to turn a
// forecast into a little picture, and they were each keeping their own copy of
// these lists before.

export type Condition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "windy"
  | "foggy";

export const CONDITION_ICON: Record<Condition, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  windy: "💨",
  foggy: "🌫️",
};

// Environment Canada describes the weather in words, so we match on the words.
export function conditionFromLabel(label: string): Condition {
  const text = label.toLowerCase();
  if (text.includes("fog")) return "foggy";
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower"))
    return "rainy";
  if (text.includes("snow") || text.includes("flurr")) return "snowy";
  if (text.includes("wind") || text.includes("breez")) return "windy";
  if (text.includes("sun") || text.includes("clear")) return "sunny";
  return "cloudy";
}

// Open-Meteo uses numbered codes instead. The ranges come from their docs.
export function conditionFromCode(code: number): Condition {
  if (code === 0 || code === 1) return "sunny";
  if (code === 45 || code === 48) return "foggy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95)
    return "rainy";
  return "cloudy";
}
