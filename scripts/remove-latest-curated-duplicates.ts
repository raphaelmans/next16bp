/**
 * Remove high-confidence curated duplicate places inserted by the March 8, 2026
 * production seed run.
 *
 * Default behavior:
 * - Targets a safelisted set of latest-added curated duplicates
 * - Deletes dependent open play rows first
 * - Deletes courts, then places
 * - Refuses to delete claimed/owned places or places with reservations
 *
 * Usage:
 *   pnpm db:remove:latest-curated-duplicates:production -- --dry-run
 *   pnpm db:remove:latest-curated-duplicates:production -- --confirm
 *   pnpm db:remove:latest-curated-duplicates:production -- --dry-run --id db7d6f86-191b-4deb-bf51-ce75b7b29ae2
 */

import { inArray, or, type SQL, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/shared/infra/db/schema";

type DuplicateCandidate = {
  keepId: string;
  keepName: string;
  removeId: string;
  removeName: string;
  city: string;
  province: string;
  similarityScore: number;
  reason: string;
};

interface ScriptOptions {
  dryRun: boolean;
  confirm: boolean;
  selectedIds: string[];
}

const DEFAULT_DUPLICATE_CANDIDATES: DuplicateCandidate[] = [
  {
    keepId: "3bbd9e88-7abd-4e04-92e5-96b4cb9f80f9",
    keepName: "Dink N’ Dash Pickleball",
    removeId: "a10dbc0f-3d3b-46a0-b7df-a70c45a1cde1",
    removeName: "Dink N Dash Pickleball",
    city: "DUMAGUETE CITY",
    province: "NEGROS ORIENTAL",
    similarityScore: 1,
    reason: "normalized apostrophe variant",
  },
  {
    keepId: "09b88c3a-e425-48d4-8f41-5b2e43a40548",
    keepName: "Match Point - Badminton and Pickleball Court",
    removeId: "0370828e-d4bd-4de8-a08b-9b15f5173ccf",
    removeName: "Match Point Badminton And Pickleball",
    city: "LILOAN",
    province: "CEBU",
    similarityScore: 0.853658556938171,
    reason: "same venue name variant",
  },
  {
    keepId: "af8c865b-0da9-4793-94cc-e788ac171158",
    keepName: "Incredoball Sports and Development Center",
    removeId: "b90e58df-c44d-46cd-9e83-3c51a97ade40",
    removeName: "InCredoBall Sports & Development",
    city: "DUMAGUETE CITY",
    province: "NEGROS ORIENTAL",
    similarityScore: 0.756097555160522,
    reason: "same venue shortened variant",
  },
  {
    keepId: "85d52fbf-a0b1-4bef-ac3f-8719f5168670",
    keepName: "HQ Pickleball",
    removeId: "db7d6f86-191b-4deb-bf51-ce75b7b29ae2",
    removeName: "HQ PICKLEBALL CEBU",
    city: "CEBU CITY",
    province: "CEBU",
    similarityScore: 0.736842095851898,
    reason: "same venue with city suffix",
  },
  {
    keepId: "5b0e03a4-40cc-4e5d-8d7a-6b98ec0930a6",
    keepName: "DECO Pickleball Courts",
    removeId: "14f3f6ca-be30-4859-b27e-28ddece66220",
    removeName: "DECO PICKLEBALL",
    city: "DUMAGUETE CITY",
    province: "NEGROS ORIENTAL",
    similarityScore: 0.695652186870575,
    reason: "same venue shortened variant",
  },
];

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
    selectedIds: [],
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
    if (arg === "--id") {
      const value = args[index + 1];
      if (!value) throw new Error("--id requires a value");
      options.selectedIds.push(value.trim());
      index += 1;
      continue;
    }
    if (arg.startsWith("--id=")) {
      options.selectedIds.push(arg.replace("--id=", "").trim());
      continue;
    }
    if (arg === "--ids") {
      const value = args[index + 1];
      if (!value) throw new Error("--ids requires a value");
      options.selectedIds.push(...parseList(value));
      index += 1;
      continue;
    }
    if (arg.startsWith("--ids=")) {
      options.selectedIds.push(...parseList(arg.replace("--ids=", "")));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  options.selectedIds = Array.from(new Set(options.selectedIds));
  return options;
}

function countWhere(
  db: ReturnType<typeof drizzle<typeof schema>>,
  table:
    | typeof schema.place
    | typeof schema.court
    | typeof schema.openPlay
    | typeof schema.externalOpenPlay
    | typeof schema.reservation,
  where: SQL<unknown>,
): Promise<number> {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(where)
    .then((result) => result[0]?.count ?? 0);
}

async function main() {
  const options = parseArgs();

  const selectedCandidates =
    options.selectedIds.length > 0
      ? DEFAULT_DUPLICATE_CANDIDATES.filter((candidate) =>
          options.selectedIds.includes(candidate.removeId),
        )
      : DEFAULT_DUPLICATE_CANDIDATES;

  if (selectedCandidates.length === 0) {
    throw new Error("No duplicate candidates matched the provided ids.");
  }

  const unknownIds = options.selectedIds.filter(
    (id) =>
      !DEFAULT_DUPLICATE_CANDIDATES.some(
        (candidate) => candidate.removeId === id,
      ),
  );
  if (unknownIds.length > 0) {
    throw new Error(
      `Unknown duplicate candidate id(s): ${unknownIds.join(", ")}`,
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    const removeIds = selectedCandidates.map((candidate) => candidate.removeId);
    const keepIds = selectedCandidates.map((candidate) => candidate.keepId);

    const placesToRemove = await db.query.place.findMany({
      where: inArray(schema.place.id, removeIds),
    });
    const placesToKeep = await db.query.place.findMany({
      where: inArray(schema.place.id, keepIds),
    });

    if (placesToRemove.length !== removeIds.length) {
      const foundIds = new Set(placesToRemove.map((place) => place.id));
      const missingIds = removeIds.filter((id) => !foundIds.has(id));
      throw new Error(
        `Some remove targets were not found: ${missingIds.join(", ")}`,
      );
    }

    if (placesToKeep.length !== keepIds.length) {
      const foundIds = new Set(placesToKeep.map((place) => place.id));
      const missingIds = keepIds.filter((id) => !foundIds.has(id));
      throw new Error(
        `Some keep targets were not found: ${missingIds.join(", ")}`,
      );
    }

    for (const place of placesToRemove) {
      if (place.placeType !== "CURATED") {
        throw new Error(`Refusing to delete non-curated place: ${place.id}`);
      }
      if (place.claimStatus !== "UNCLAIMED") {
        throw new Error(`Refusing to delete claimed place: ${place.id}`);
      }
      if (place.organizationId) {
        throw new Error(`Refusing to delete owned place: ${place.id}`);
      }
      if (!place.isActive) {
        throw new Error(`Refusing to delete inactive place: ${place.id}`);
      }
    }

    const targetCourts = await db
      .select({ id: schema.court.id, placeId: schema.court.placeId })
      .from(schema.court)
      .where(inArray(schema.court.placeId, removeIds));
    const targetCourtIds = targetCourts.map((court) => court.id);

    const openPlayWhere =
      targetCourtIds.length > 0
        ? or(
            inArray(schema.openPlay.placeId, removeIds),
            inArray(schema.openPlay.courtId, targetCourtIds),
          )
        : inArray(schema.openPlay.placeId, removeIds);

    const summary = {
      places: placesToRemove.length,
      courts: targetCourtIds.length,
      openPlay: await countWhere(db, schema.openPlay, openPlayWhere),
      externalOpenPlay: await countWhere(
        db,
        schema.externalOpenPlay,
        inArray(schema.externalOpenPlay.placeId, removeIds),
      ),
      reservations:
        targetCourtIds.length > 0
          ? await countWhere(
              db,
              schema.reservation,
              inArray(schema.reservation.courtId, targetCourtIds),
            )
          : 0,
    };

    if (summary.reservations > 0) {
      throw new Error(
        `Refusing to delete because ${summary.reservations} reservation row(s) reference the target places/courts.`,
      );
    }

    console.log("Latest curated duplicate cleanup plan:");
    for (const candidate of selectedCandidates) {
      const removePlace = placesToRemove.find(
        (place) => place.id === candidate.removeId,
      );
      const keepPlace = placesToKeep.find(
        (place) => place.id === candidate.keepId,
      );
      if (!removePlace || !keepPlace) {
        throw new Error(
          `Internal mapping error for candidate ${candidate.removeId}`,
        );
      }

      console.log(
        `  REMOVE ${removePlace.name} (${removePlace.slug}) -> KEEP ${keepPlace.name} (${keepPlace.slug})`,
      );
      console.log(
        `    ${candidate.city}, ${candidate.province} | similarity=${candidate.similarityScore.toFixed(3)} | ${candidate.reason}`,
      );
    }

    console.log("\nDependent rows:");
    console.log(`  Places: ${summary.places}`);
    console.log(`  Courts: ${summary.courts}`);
    console.log(`  Open play: ${summary.openPlay}`);
    console.log(`  External open play: ${summary.externalOpenPlay}`);
    console.log(`  Reservations: ${summary.reservations}`);

    if (options.dryRun) {
      console.log("\nDry run complete. No rows deleted.");
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
        .where(inArray(schema.externalOpenPlay.placeId, removeIds));

      await tx.delete(schema.openPlay).where(openPlayWhere);

      if (targetCourtIds.length > 0) {
        await tx
          .delete(schema.court)
          .where(inArray(schema.court.id, targetCourtIds));
      }

      await tx.delete(schema.place).where(inArray(schema.place.id, removeIds));
    });

    console.log("\nLatest curated duplicate cleanup completed successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
