import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

type ProvincesCities = Record<string, string[]>;

let cachedProvincesCities: ProvincesCities | null = null;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProvincesCities(value: unknown): ProvincesCities {
  if (!isRecord(value)) {
    throw new Error("Invalid provinces/cities JSON shape");
  }

  const entries: Array<[string, string[]]> = [];

  for (const [province, rawCities] of Object.entries(value)) {
    if (typeof province !== "string" || province.trim().length === 0) continue;
    if (!Array.isArray(rawCities)) continue;

    const cities = rawCities
      .filter((city): city is string => typeof city === "string")
      .map((city) => city.trim())
      .filter((city) => city.length > 0)
      .sort((a, b) => a.localeCompare(b));

    if (cities.length === 0) continue;

    entries.push([province, Array.from(new Set(cities))]);
  }

  entries.sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(entries);
}

async function loadProvincesCities(): Promise<ProvincesCities> {
  if (cachedProvincesCities) return cachedProvincesCities;

  const filePath = path.join(
    process.cwd(),
    "public",
    "assets",
    "files",
    "ph-provinces-cities.json",
  );
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  cachedProvincesCities = normalizeProvincesCities(parsed);
  return cachedProvincesCities;
}

export async function GET(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
    const provincesCities = await loadProvincesCities();

    return NextResponse.json(
      {
        data: provincesCities,
        meta: {
          totalProvinces: Object.keys(provincesCities).length,
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
