import type { Condition } from "@/lib/weatherIcons";

// Drawn as SVG rather than using emoji. Emoji are rendered by the operating
// system, so the same forecast looked different on every machine and could not
// be coloured to match the rest of the site. These follow the current text
// colour instead.
export default function WeatherGlyph({
  condition,
  className = "h-6 w-6",
}: {
  condition: Condition;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (condition === "sunny") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
    );
  }

  if (condition === "cloudy") {
    return (
      <svg {...common}>
        <path d="M7.5 18.5h9.2a3.8 3.8 0 0 0 .3-7.6 5.6 5.6 0 0 0-10.8-1.2 4.4 4.4 0 0 0 1.3 8.8Z" />
      </svg>
    );
  }

  if (condition === "rainy") {
    return (
      <svg {...common}>
        <path d="M7.6 15.5h9a3.6 3.6 0 0 0 .3-7.2 5.4 5.4 0 0 0-10.4-1.1 4.2 4.2 0 0 0 1.1 8.3Z" />
        <path d="M9 18.5l-1 2.2M13 18.5l-1 2.2M17 18.5l-1 2.2" />
      </svg>
    );
  }

  if (condition === "snowy") {
    return (
      <svg {...common}>
        <path d="M7.6 15.5h9a3.6 3.6 0 0 0 .3-7.2 5.4 5.4 0 0 0-10.4-1.1 4.2 4.2 0 0 0 1.1 8.3Z" />
        <path d="M9 19h.01M12.5 20.5h.01M16 19h.01" />
      </svg>
    );
  }

  if (condition === "windy") {
    return (
      <svg {...common}>
        <path d="M3 8.5h11a2.75 2.75 0 1 0-2.75-2.75" />
        <path d="M3 13h15a3 3 0 1 1-3 3" />
        <path d="M3 17.5h8" />
      </svg>
    );
  }

  // foggy
  return (
    <svg {...common}>
      <path d="M7.6 12.5h9a3.6 3.6 0 0 0 .3-7.2A5.4 5.4 0 0 0 6.5 4.2a4.2 4.2 0 0 0 1.1 8.3Z" />
      <path d="M4 16h16M6 19h13" />
    </svg>
  );
}
