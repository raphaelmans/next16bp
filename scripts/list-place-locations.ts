import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/lib/shared/infra/db/schema";
import { resolveGooglePlaceId } from "../src/lib/shared/lib/google-maps/resolve-google-place-id";

type PlaceLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type BackfillStatus = "updated" | "dry_run" | "no_match" | "skipped";

type BackfillResult = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
  status: BackfillStatus;
  source?: "cache" | "api";
  reason?: string;
};

const DEFAULT_LIMIT = 50;

const toNumber = (value: string | number | null): number | null => {
  if (value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseNumberArg = (name: string): number | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : undefined;
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY environment variable is not set");
  }

  const limit = parseNumberArg("limit") ?? DEFAULT_LIMIT;
  const offset = parseNumberArg("offset") ?? 0;
  const isDryRun = process.argv.includes("--dry-run");

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    const places = await db.query.place.findMany({
      columns: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        extGPlaceId: true,
      },
      where: (place, helpers) =>
        helpers.and(
          helpers.isNotNull(place.latitude),
          helpers.isNotNull(place.longitude),
          helpers.isNull(place.extGPlaceId),
        ),
      orderBy: (place, helpers) => helpers.asc(place.createdAt),
      limit,
      offset,
    });

    const output: PlaceLocation[] = places
      .map((place) => {
        const lat = toNumber(place.latitude);
        const lng = toNumber(place.longitude);
        if (lat === null || lng === null) return null;
        return {
          id: place.id,
          name: place.name,
          lat,
          lng,
        };
      })
      .filter((place): place is PlaceLocation => Boolean(place));

    const results: BackfillResult[] = [];
    let updatedCount = 0;
    let noMatchCount = 0;
    const skippedCount = places.length - output.length;

    for (const place of output) {
      const resolved = await resolveGooglePlaceId({
        apiKey,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
      });

      if (!resolved.placeId) {
        noMatchCount += 1;
        results.push({
          id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          placeId: null,
          status: "no_match",
          source: resolved.source,
        });
        continue;
      }

      if (!isDryRun) {
        await db
          .update(schema.place)
          .set({
            extGPlaceId: resolved.placeId,
            updatedAt: new Date(),
          })
          .where(eq(schema.place.id, place.id));
      }

      updatedCount += 1;
      results.push({
        id: place.id,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        placeId: resolved.placeId,
        status: isDryRun ? "dry_run" : "updated",
        source: resolved.source,
      });
    }

    const summary = {
      limit,
      offset,
      updated: updatedCount,
      skipped: skippedCount,
      noMatch: noMatchCount,
      dryRun: isDryRun,
    };

    console.log(JSON.stringify({ summary, items: results }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
