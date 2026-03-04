/**
 * Reset curated staging data while preserving safelisted place slugs.
 *
 * Default behavior:
 * - Deletes CURATED places except preserved slugs
 * - Deletes dependent records that block place/court deletion
 * - Leaves RESERVABLE/org/user data untouched
 *
 * Usage:
 *   pnpm db:reset:curated-staging -- --dry-run
 *   pnpm db:reset:curated-staging -- --confirm
 *   pnpm db:reset:curated-staging -- --confirm --preserve-slug kudos-courts-complex
 */

import { and, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/shared/infra/db/schema";

interface ScriptOptions {
  dryRun: boolean;
  confirm: boolean;
  preserveSlugs: string[];
}

const DEFAULT_PRESERVE_SLUGS = ["kudos-courts-complex"];

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: false,
    confirm: false,
    preserveSlugs: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") continue;
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--confirm") {
      options.confirm = true;
      continue;
    }

    if (arg === "--preserve-slug") {
      const value = args[index + 1];
      if (!value) throw new Error("--preserve-slug requires a value");
      options.preserveSlugs.push(value.trim());
      index += 1;
      continue;
    }

    if (arg.startsWith("--preserve-slug=")) {
      options.preserveSlugs.push(arg.replace("--preserve-slug=", "").trim());
      continue;
    }

    if (arg === "--preserve-slugs") {
      const value = args[index + 1];
      if (!value) throw new Error("--preserve-slugs requires a value");
      options.preserveSlugs.push(...parseList(value));
      index += 1;
      continue;
    }

    if (arg.startsWith("--preserve-slugs=")) {
      options.preserveSlugs.push(
        ...parseList(arg.replace("--preserve-slugs=", "")),
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.preserveSlugs = Array.from(
    new Set(
      (options.preserveSlugs.length > 0
        ? options.preserveSlugs
        : DEFAULT_PRESERVE_SLUGS
      ).filter((slug) => slug.length > 0),
    ),
  );

  return options;
}

async function countByCondition(args: {
  db: ReturnType<typeof drizzle<typeof schema>>;
  table:
    | typeof schema.place
    | typeof schema.court
    | typeof schema.openPlay
    | typeof schema.externalOpenPlay;
  where: ReturnType<typeof and> | ReturnType<typeof or>;
}): Promise<number> {
  const result = await args.db
    .select({ count: sql<number>`count(*)::int` })
    .from(args.table)
    .where(args.where);
  return result[0]?.count ?? 0;
}

async function main() {
  const options = parseArgs();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    const placeWhere = and(
      eq(schema.place.placeType, "CURATED"),
      notInArray(schema.place.slug, options.preserveSlugs),
    );

    const targetPlaces = await db
      .select({
        id: schema.place.id,
        slug: schema.place.slug,
        name: schema.place.name,
      })
      .from(schema.place)
      .where(placeWhere);

    const targetPlaceIds = targetPlaces.map((place) => place.id);
    if (targetPlaceIds.length === 0) {
      console.log("No curated places matched reset criteria.");
      return;
    }

    const targetCourts = await db
      .select({ id: schema.court.id })
      .from(schema.court)
      .where(inArray(schema.court.placeId, targetPlaceIds));
    const targetCourtIds = targetCourts.map((court) => court.id);

    const openPlayWhere =
      targetCourtIds.length > 0
        ? or(
            inArray(schema.openPlay.placeId, targetPlaceIds),
            inArray(schema.openPlay.courtId, targetCourtIds),
          )
        : inArray(schema.openPlay.placeId, targetPlaceIds);

    const placeCount = targetPlaceIds.length;
    const courtCount =
      targetCourtIds.length > 0
        ? await countByCondition({
            db,
            table: schema.court,
            where: inArray(schema.court.id, targetCourtIds),
          })
        : 0;
    const openPlayCount = await countByCondition({
      db,
      table: schema.openPlay,
      where: openPlayWhere,
    });
    const externalOpenPlayCount = await countByCondition({
      db,
      table: schema.externalOpenPlay,
      where: inArray(schema.externalOpenPlay.placeId, targetPlaceIds),
    });

    console.log("Curated reset plan:");
    console.log(`  Preserve slugs: ${options.preserveSlugs.join(", ")}`);
    console.log(`  Target curated places: ${placeCount}`);
    console.log(`  Target courts: ${courtCount}`);
    console.log(`  Target open_play rows: ${openPlayCount}`);
    console.log(`  Target external_open_play rows: ${externalOpenPlayCount}`);

    if (options.dryRun) {
      console.log("Dry run complete. No rows deleted.");
      return;
    }

    if (!options.confirm) {
      throw new Error(
        "Refusing to delete without --confirm. Re-run with --confirm to execute.",
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.externalOpenPlay)
        .where(inArray(schema.externalOpenPlay.placeId, targetPlaceIds));

      await tx.delete(schema.openPlay).where(openPlayWhere);

      if (targetCourtIds.length > 0) {
        await tx
          .delete(schema.court)
          .where(inArray(schema.court.id, targetCourtIds));
      }

      await tx
        .delete(schema.place)
        .where(inArray(schema.place.id, targetPlaceIds));
    });

    console.log("Curated staging reset completed successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
