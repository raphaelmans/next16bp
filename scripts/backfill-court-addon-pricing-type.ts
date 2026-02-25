import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/shared/infra/db/schema";

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    const updated = await db.execute(sql`
      UPDATE court_addon
      SET pricing_type = CASE
        WHEN flat_fee_cents IS NOT NULL THEN 'FLAT'::court_addon_pricing_type
        ELSE 'HOURLY'::court_addon_pricing_type
      END
      WHERE pricing_type IS NULL
      RETURNING id
    `);

    const updatedCount = Array.isArray(updated)
      ? updated.length
      : Number((updated as { rowCount?: unknown }).rowCount ?? 0);

    console.info(`Backfilled court_addon.pricing_type rows: ${updatedCount}`);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("Failed to backfill court_addon.pricing_type", error);
  process.exit(1);
});
