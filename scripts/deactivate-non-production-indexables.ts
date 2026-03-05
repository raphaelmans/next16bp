import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isLikelyNonProductionSlug } from "../src/common/seo-slug-filter";
import { organization, place } from "../src/lib/shared/infra/db/schema";

type Candidate = {
  type: "place" | "organization";
  id: string;
  slug: string;
};

const shouldExecute = process.argv.includes("--execute");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  const [activePlaces, activeOrganizations] = await Promise.all([
    db
      .select({ id: place.id, slug: place.slug })
      .from(place)
      .where(eq(place.isActive, true)),
    db
      .select({ id: organization.id, slug: organization.slug })
      .from(organization)
      .where(eq(organization.isActive, true)),
  ]);

  const candidates: Candidate[] = [
    ...activePlaces
      .filter((row) => isLikelyNonProductionSlug(row.slug))
      .map((row) => ({ type: "place" as const, id: row.id, slug: row.slug })),
    ...activeOrganizations
      .filter((row) => isLikelyNonProductionSlug(row.slug))
      .map((row) => ({
        type: "organization" as const,
        id: row.id,
        slug: row.slug,
      })),
  ];

  console.info(
    `Found ${candidates.length} active non-production slugs (place=${candidates.filter((c) => c.type === "place").length}, organization=${candidates.filter((c) => c.type === "organization").length})`,
  );

  if (candidates.length > 0) {
    for (const candidate of candidates) {
      console.info(`${candidate.type}\t${candidate.slug}\t${candidate.id}`);
    }
  }

  if (!shouldExecute) {
    console.info(
      "Dry run only. Re-run with --execute to deactivate the candidates above.",
    );
    await client.end();
    return;
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    for (const candidate of candidates) {
      if (candidate.type === "place") {
        await tx
          .update(place)
          .set({ isActive: false, updatedAt: now })
          .where(eq(place.id, candidate.id));
        continue;
      }

      await tx
        .update(organization)
        .set({ isActive: false, updatedAt: now })
        .where(eq(organization.id, candidate.id));
    }
  });

  console.info(`Deactivated ${candidates.length} non-production records.`);
  await client.end();
}

main().catch((error) => {
  console.error("Failed to deactivate non-production indexables", error);
  process.exit(1);
});
