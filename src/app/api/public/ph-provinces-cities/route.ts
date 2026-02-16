import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

type ProvinceCity = {
  name: string;
  displayName: string;
  slug: string;
};

type ProvincesCities = Array<
  ProvinceCity & {
    cities: ProvinceCity[];
  }
>;

let cachedProvincesCities: ProvincesCities | null = null;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const isProvinceCity = (value: unknown): value is ProvinceCity =>
  isRecord(value) &&
  typeof value.name === "string" &&
  typeof value.displayName === "string" &&
  typeof value.slug === "string";

function normalizeProvincesCities(value: unknown): ProvincesCities {
  if (!Array.isArray(value)) {
    throw new Error("Invalid provinces/cities JSON shape");
  }

  const entries = value
    .filter((item) => isRecord(item))
    .map((item) => {
      const cities = Array.isArray(item.cities)
        ? item.cities.filter(isProvinceCity)
        : [];

      if (!isProvinceCity(item) || cities.length === 0) {
        return null;
      }

      return {
        name: item.name.trim(),
        displayName: item.displayName.trim(),
        slug: item.slug.trim(),
        cities: cities
          .map((city) => ({
            name: city.name.trim(),
            displayName: city.displayName.trim(),
            slug: city.slug.trim(),
          }))
          .filter((city) => city.name.length > 0 && city.slug.length > 0)
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      };
    })
    .filter((item): item is ProvincesCities[number] => item !== null);

  return entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function loadProvincesCities(): Promise<ProvincesCities> {
  if (cachedProvincesCities && Array.isArray(cachedProvincesCities)) {
    return cachedProvincesCities;
  }

  cachedProvincesCities = null;

  const filePath = path.join(
    process.cwd(),
    "public",
    "assets",
    "files",
    "ph-provinces-cities.enriched.json",
  );
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  cachedProvincesCities = normalizeProvincesCities(parsed);
  return cachedProvincesCities;
}

export async function GET() {
  const requestId = globalThis.crypto.randomUUID();

  try {
    const provincesCities = await loadProvincesCities();

    return NextResponse.json(
      {
        data: provincesCities,
        meta: {
          totalProvinces: provincesCities.length,
        },
      },
      {
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    const details =
      error instanceof Error ? { message: error.message } : undefined;

    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: "Unable to load PH provinces/cities",
        requestId,
        details,
      },
      { status: 500 },
    );
  }
}
