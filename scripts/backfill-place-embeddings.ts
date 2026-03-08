/**
 * Backfill private place embeddings for server-only semantic matching use cases.
 *
 * Usage:
 *   pnpm db:backfill:place-embeddings
 *   pnpm db:backfill:place-embeddings -- --dry-run
 *   pnpm db:backfill:place-embeddings -- --limit 25
 *   pnpm db:backfill:place-embeddings -- --place-id <uuid>
 *   pnpm db:backfill:place-embeddings -- --purpose dedupe
 */

import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  buildPlaceEmbeddingCanonicalText,
  PLACE_EMBEDDING_DIMENSIONS,
  PLACE_EMBEDDING_MODEL,
  PLACE_EMBEDDING_PURPOSE_DEDUPE,
} from "../src/lib/modules/place/place-embedding";
import * as schema from "../src/lib/shared/infra/db/schema";

interface ScriptOptions {
  dryRun: boolean;
  limit: number | null;
  purpose: string;
  placeIds: string[];
}

interface PlaceEmbeddingRow {
  placeId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phoneNumber: string | null;
  viberInfo: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
}

function parseListArg(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseNumberArg(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: false,
    limit: null,
    purpose: PLACE_EMBEDDING_PURPOSE_DEDUPE,
    placeIds: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--purpose") {
      const value = args[index + 1];
      if (!value) throw new Error("--purpose requires a value");
      options.purpose = value.trim();
      index += 1;
      continue;
    }

    if (arg.startsWith("--purpose=")) {
      options.purpose = arg.replace("--purpose=", "").trim();
      continue;
    }

    if (arg === "--limit") {
      const value = args[index + 1];
      if (!value) throw new Error("--limit requires a value");
      options.limit = parseNumberArg(value, "--limit");
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = parseNumberArg(arg.replace("--limit=", ""), "--limit");
      continue;
    }

    if (arg === "--place-id") {
      const value = args[index + 1];
      if (!value) throw new Error("--place-id requires a value");
      options.placeIds.push(value.trim());
      index += 1;
      continue;
    }

    if (arg.startsWith("--place-id=")) {
      options.placeIds.push(arg.replace("--place-id=", "").trim());
      continue;
    }

    if (arg === "--place-ids") {
      const value = args[index + 1];
      if (!value) throw new Error("--place-ids requires a value");
      options.placeIds.push(...parseListArg(value));
      index += 1;
      continue;
    }

    if (arg.startsWith("--place-ids=")) {
      options.placeIds.push(...parseListArg(arg.replace("--place-ids=", "")));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.placeIds = Array.from(new Set(options.placeIds));

  if (!options.purpose) {
    throw new Error("--purpose cannot be empty");
  }

  return options;
}

async function loadPlaces(
  db: ReturnType<typeof drizzle<typeof schema>>,
  options: ScriptOptions,
): Promise<PlaceEmbeddingRow[]> {
  const conditions = [
    eq(schema.place.placeType, "CURATED"),
    eq(schema.place.isActive, true),
  ];

  if (options.placeIds.length > 0) {
    conditions.push(inArray(schema.place.id, options.placeIds));
  }

  const rows = await db
    .select({
      placeId: schema.place.id,
      name: schema.place.name,
      address: schema.place.address,
      city: schema.place.city,
      province: schema.place.province,
      country: schema.place.country,
      phoneNumber: schema.placeContactDetail.phoneNumber,
      viberInfo: schema.placeContactDetail.viberInfo,
      facebookUrl: schema.placeContactDetail.facebookUrl,
      instagramUrl: schema.placeContactDetail.instagramUrl,
      websiteUrl: schema.placeContactDetail.websiteUrl,
    })
    .from(schema.place)
    .leftJoin(
      schema.placeContactDetail,
      eq(schema.placeContactDetail.placeId, schema.place.id),
    )
    .where(and(...conditions))
    .orderBy(asc(schema.place.createdAt));

  if (options.limit !== null) {
    return rows.slice(0, options.limit);
  }

  return rows;
}

async function loadExistingEmbeddings(
  db: ReturnType<typeof drizzle<typeof schema>>,
  placeIds: string[],
  purpose: string,
) {
  if (placeIds.length === 0) {
    return new Map<string, { id: string; canonicalText: string }>();
  }

  const rows = await db
    .select({
      id: schema.placeEmbedding.id,
      placeId: schema.placeEmbedding.placeId,
      canonicalText: schema.placeEmbedding.canonicalText,
    })
    .from(schema.placeEmbedding)
    .where(
      and(
        inArray(schema.placeEmbedding.placeId, placeIds),
        eq(schema.placeEmbedding.purpose, purpose),
        eq(schema.placeEmbedding.model, PLACE_EMBEDDING_MODEL),
      ),
    );

  return new Map(
    rows.map((row) => [
      row.placeId,
      { id: row.id, canonicalText: row.canonicalText },
    ]),
  );
}

async function main() {
  const options = parseArgs();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    console.log("Starting place embedding backfill...\n");
    console.log(`Purpose: ${options.purpose}`);
    console.log(`Mode: ${options.dryRun ? "dry run" : "write"}`);
    console.log(`Model: ${PLACE_EMBEDDING_MODEL}`);
    console.log(`Dimensions: ${PLACE_EMBEDDING_DIMENSIONS}\n`);

    const places = await loadPlaces(db, options);
    const existingByPlaceId = await loadExistingEmbeddings(
      db,
      places.map((place) => place.placeId),
      options.purpose,
    );

    const pending = places
      .map((place) => {
        const canonicalText = buildPlaceEmbeddingCanonicalText(place);
        const existing = existingByPlaceId.get(place.placeId);
        return {
          ...place,
          canonicalText,
          existingEmbeddingId: existing?.id ?? null,
          unchanged: existing?.canonicalText === canonicalText,
        };
      })
      .filter((entry) => !entry.unchanged);

    console.log(`Active curated places scanned: ${places.length}`);
    console.log(
      `Embeddings already current: ${places.length - pending.length}`,
    );
    console.log(`Embeddings to generate: ${pending.length}\n`);

    if (pending.length === 0) {
      console.log("No place embeddings need updating.");
      return;
    }

    if (options.dryRun) {
      for (const entry of pending) {
        console.log(
          `  Would upsert embedding: ${entry.name} (${entry.placeId})`,
        );
      }
      return;
    }

    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel(PLACE_EMBEDDING_MODEL),
      values: pending.map((entry) => entry.canonicalText),
      maxParallelCalls: 1,
    });

    if (embeddings.length !== pending.length) {
      throw new Error("Embedding count did not match pending row count");
    }

    const now = new Date();
    const values = pending.map((entry, index) => ({
      placeId: entry.placeId,
      purpose: options.purpose,
      model: PLACE_EMBEDDING_MODEL,
      dimensions: PLACE_EMBEDDING_DIMENSIONS,
      canonicalText: entry.canonicalText,
      embedding: embeddings[index] ?? [],
      updatedAt: now,
    }));

    await db
      .insert(schema.placeEmbedding)
      .values(values)
      .onConflictDoUpdate({
        target: [
          schema.placeEmbedding.placeId,
          schema.placeEmbedding.purpose,
          schema.placeEmbedding.model,
        ],
        set: {
          dimensions: sql`excluded.dimensions`,
          canonicalText: sql`excluded.canonical_text`,
          embedding: sql`excluded.embedding`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    for (const entry of pending) {
      console.log(`  Upserted embedding: ${entry.name} (${entry.placeId})`);
    }

    console.log("\nPlace embedding backfill completed successfully!");
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
