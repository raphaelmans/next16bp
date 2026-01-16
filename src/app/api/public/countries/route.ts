import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

interface Country {
  name: string;
  cca2: string;
}

let cachedCountries: Country[] | null = null;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

async function loadCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;

  const filePath = path.join(
    process.cwd(),
    "public",
    "assets",
    "countries.json",
  );
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Country[];

  const normalized = parsed
    .filter(
      (entry) =>
        entry &&
        typeof entry.name === "string" &&
        typeof entry.cca2 === "string",
    )
    .map((entry) => ({ name: entry.name, cca2: entry.cca2 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedCountries = normalized;
  return normalized;
}

function buildListResponse(countries: Country[]) {
  return {
    data: countries,
    meta: {
      total: countries.length,
      limit: countries.length,
      cursor: null,
      nextCursor: null,
      sort: "asc",
    },
  };
}

export async function GET(req: Request) {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();

  try {
    const countries = await loadCountries();
    return NextResponse.json(buildListResponse(countries), {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    const details =
      error instanceof Error ? { message: error.message } : undefined;

    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: "Unable to load countries",
        requestId,
        details,
      },
      { status: 500 },
    );
  }
}
