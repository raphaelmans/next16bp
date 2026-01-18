import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = path.join(
  process.cwd(),
  "public",
  "assets",
  "files",
  "ph-provinces-cities.json",
);

const OUTPUT_FILE = path.join(
  process.cwd(),
  "public",
  "assets",
  "files",
  "ph-provinces-cities.enriched.json",
);

const OUTPUT_MIN_FILE = path.join(
  process.cwd(),
  "public",
  "assets",
  "files",
  "ph-provinces-cities.enriched.min.json",
);

const METRO_MANILA_KEY = "METRO MANILA";
const NCR_PREFIX = "NATIONAL CAPITAL REGION";
const NCR_EXTRA_KEY = "TAGUIG - PATEROS";
const METRO_MANILA_CITY = "MANILA";

const SMALL_WORDS = new Set([
  "and",
  "or",
  "of",
  "the",
  "in",
  "on",
  "at",
  "to",
  "for",
  "by",
]);

const toTitleCase = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s-\s/g, " - ");

  const tokens = normalized.split(" ");

  return tokens
    .map((word, index) => {
      if (!word) return word;
      if (SMALL_WORDS.has(word) && index !== 0) return word;

      return word
        .split("-")
        .map((segment) => {
          if (!segment) return segment;

          return segment
            .split("(")
            .map((part) => {
              if (!part) return part;
              return `${part[0].toUpperCase()}${part.slice(1)}`;
            })
            .join("(");
        })
        .join("-");
    })
    .join(" ");
};

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const sortByDisplay = <T extends { displayName: string }>(items: T[]) =>
  items.sort((a, b) => a.displayName.localeCompare(b.displayName));

const ensureArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

const buildEnrichedData = (raw: Record<string, string[]>) => {
  const metroCities: string[] = [];
  const provinces: Array<{
    name: string;
    displayName: string;
    slug: string;
    cities: Array<{ name: string; displayName: string; slug: string }>;
  }> = [];

  const addProvince = (provinceName: string, cityNames: string[]) => {
    if (!provinceName || cityNames.length === 0) return;

    const uniqueCities = Array.from(new Set(cityNames));
    const cities = sortByDisplay(
      uniqueCities.map((city) => ({
        name: city,
        displayName: toTitleCase(city),
        slug: toSlug(toTitleCase(city)),
      })),
    );

    provinces.push({
      name: provinceName,
      displayName: toTitleCase(provinceName),
      slug: toSlug(toTitleCase(provinceName)),
      cities,
    });
  };

  Object.entries(raw).forEach(([provinceName, cityList]) => {
    if (!provinceName) return;

    const normalizedCities = ensureArray(cityList)
      .map((city) => city.trim())
      .filter(Boolean);

    if (provinceName.startsWith(NCR_PREFIX) || provinceName === NCR_EXTRA_KEY) {
      metroCities.push(...normalizedCities);
      return;
    }

    addProvince(provinceName, normalizedCities);
  });

  if (metroCities.length > 0) {
    addProvince(METRO_MANILA_KEY, [METRO_MANILA_CITY, ...metroCities]);
  }

  return sortByDisplay(provinces);
};

const main = async () => {
  const raw = await readFile(SOURCE_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, string[]>;
  const enriched = buildEnrichedData(parsed);

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(enriched, null, 2)}\n`,
    "utf-8",
  );
  await writeFile(OUTPUT_MIN_FILE, JSON.stringify(enriched), "utf-8");
};

main().catch((error) => {
  console.error("Failed to generate enriched PH location data", error);
  process.exit(1);
});
