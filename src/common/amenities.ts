export const PLACE_AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "WiFi",
  "Air Conditioning",
  "Covered Courts",
  "Pet Friendly",
] as const;

export const getAmenityKey = (value: string) => value.trim().toLowerCase();

export const trimAmenityLabel = (value: string) => value.trim();

const CURATED_AMENITY_LABELS = new Map(
  PLACE_AMENITIES.map((amenity) => [getAmenityKey(amenity), amenity]),
);

export const getAmenityDisplayLabel = (value: string) => {
  const trimmed = trimAmenityLabel(value);
  if (!trimmed) {
    return "";
  }

  return CURATED_AMENITY_LABELS.get(getAmenityKey(trimmed)) ?? trimmed;
};

export const normalizeAmenityValues = (values: readonly string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const trimmed = trimAmenityLabel(value);
    if (!trimmed) {
      continue;
    }

    const key = getAmenityKey(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
};

export const mergeAmenityOptions = (
  ...sources: ReadonlyArray<readonly string[]>
) => {
  const merged = new Map<string, string>();

  for (const source of sources) {
    for (const value of source) {
      const trimmed = trimAmenityLabel(value);
      if (!trimmed) {
        continue;
      }

      const key = getAmenityKey(trimmed);
      if (!merged.has(key)) {
        merged.set(key, getAmenityDisplayLabel(trimmed));
      }
    }
  }

  return Array.from(merged.values()).sort((left, right) =>
    left.localeCompare(right),
  );
};
