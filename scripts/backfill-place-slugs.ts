import { eq, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isUuid, normalizePlaceSlug } from "../src/lib/slug";
import * as schema from "../src/shared/infra/db/schema";

const FALLBACK_PREFIX = "venue";

const ensureUniqueSlug = (base: string, existing: Set<string>): string => {
  let candidate = base;
  let counter = 2;
  while (existing.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};

const buildSlug = (name: string, placeId: string, existing: Set<string>) => {
  let baseSlug = normalizePlaceSlug(name);
  if (!baseSlug) {
    baseSlug = `${FALLBACK_PREFIX}-${placeId.slice(0, 8)}`;
  }
  if (isUuid(baseSlug)) {
    baseSlug = `${FALLBACK_PREFIX}-${baseSlug.slice(0, 8)}`;
  }
  return ensureUniqueSlug(baseSlug, existing);
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  const existingSlugs = new Set<string>();
  const slugRows = await db.select({ slug: schema.place.slug }).from(schema.place);
  for (const row of slugRows) {
    if (row.slug) {
      existingSlugs.add(row.slug);
    }
  }

  const places = await db
    .select({ id: schema.place.id, name: schema.place.name })
    .from(schema.place)
    .where(or(isNull(schema.place.slug), eq(schema.place.slug, "")));

  let updated = 0;
  for (const place of places) {
    const slug = buildSlug(place.name, place.id, existingSlugs);
    await db
      .update(schema.place)
      .set({ slug })
      .where(eq(schema.place.id, place.id));
    existingSlugs.add(slug);
    updated += 1;
  }

  await client.end();
  console.info(`Backfilled ${updated} place slugs`);
};

main().catch((error) => {
  console.error("Failed to backfill place slugs", error);
  process.exit(1);
});
