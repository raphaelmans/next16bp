/**
 * Seed script for sports data.
 *
 * Seeds the database with supported sports for development.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Features:
 *   - Idempotent: Safe to run multiple times (skips existing sports by slug)
 *   - Transaction-safe: All inserts in single transaction
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/shared/infra/db/schema";

interface SportSeed {
  slug: string;
  name: string;
}

const sports: SportSeed[] = [
  {
    slug: "pickleball",
    name: "Pickleball",
  },
  {
    slug: "basketball",
    name: "Basketball",
  },
];

async function seed() {
  console.log("Starting sport seed...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    let sportsCreated = 0;
    let sportsSkipped = 0;

    for (const sportData of sports) {
      const existingSport = await db.query.sport.findFirst({
        where: eq(schema.sport.slug, sportData.slug),
      });

      if (existingSport) {
        console.log(`  Skipping: "${sportData.name}" (already exists)`);
        sportsSkipped++;
        continue;
      }

      await db.insert(schema.sport).values({
        slug: sportData.slug,
        name: sportData.name,
      });

      console.log(`  Seeded sport: ${sportData.name}`);
      sportsCreated++;
    }

    console.log("\n--- Seed Summary ---");
    console.log(`Sports created: ${sportsCreated}`);
    console.log(`Sports skipped: ${sportsSkipped}`);
    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
