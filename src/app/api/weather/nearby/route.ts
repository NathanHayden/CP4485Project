const SITES = [
  { id: "nl-24", name: "St. John's" },
];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : Math.round(parsed);
}

function regionText(region: unknown): string {
  if (!region) {
    return "";
  }
  if (typeof region === "string") {
    return region;
  }
  const asRecord = region as { en?: string };
  return asRecord.en ? asRecord.en : "";
}

type CurrentConditions = {
  temperature?: { value?: { en?: string } };
  condition?: { en?: string };
  wind?: { speed?: { value?: { en?: string } } };
  relativeHumidity?: { value?: { en?: string } };
  visibility?: { value?: { en?: string } };
  humidex?: { value?: { en?: string } };
  windChill?: { value?: { en?: string } };
};

function parseCity(
  name: string,
  region: unknown,
  lon: number | null,
  lat: number | null,
  cc: CurrentConditions
) {
  const temp = toNumber(cc?.temperature?.value?.en);
  const humidex = toNumber(cc?.humidex?.value?.en);
  const windChill = toNumber(cc?.windChill?.value?.en);

  let feelsLike = temp;
  if (humidex !== null) {
    feelsLike = humidex;
  } else if (windChill !== null) {
    feelsLike = windChill;
  }
  if (feelsLike !== null && temp !== null && Math.abs(feelsLike - temp) > 15) {
    feelsLike = temp;
  }

  return {
    name,
    region: regionText(region),
    lon,
    lat,
    temp,
    feelsLike,
    label: cc?.condition?.en ? cc.condition.en : "",
    wind: toNumber(cc?.wind?.speed?.value?.en),
    humidity: toNumber(cc?.relativeHumidity?.value?.en),
    visibility: toNumber(cc?.visibility?.value?.en),
  };
}

const UNAVAILABLE = "The weather service is unavailable right now.";

export async function GET() {
  try {
    const cities = await Promise.all(
      SITES.map(async (site) => {
        const res = await fetch(
          `https://api.weather.gc.ca/collections/citypageweather-realtime/items/${site.id}?lang=en`,
          { next: { revalidate: 600 } }
        );

        if (!res.ok) {
          throw new Error(
            `Environment Canada replied with ${res.status} for ${site.id}.`
          );
        }

        const data = await res.json();
        const props = data.properties;

        // An error payload still parses as JSON, so check for the parts we
        // actually read before reaching into them.
        if (!props || !props.currentConditions) {
          throw new Error(`Environment Canada sent no conditions for ${site.id}.`);
        }

        const coordinates = data.geometry
          ? data.geometry.coordinates
          : [null, null];

        return parseCity(
          site.name,
          props.region,
          coordinates[0],
          coordinates[1],
          props.currentConditions
        );
      })
    );

    return Response.json(cities);
  } catch (error) {
    console.error("Could not load current conditions:", error);
    return Response.json({ error: UNAVAILABLE }, { status: 502 });
  }
}
