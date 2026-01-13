/**
 * Seed script for Supabase Storage buckets
 *
 * Creates storage buckets used for asset uploads (public for now).
 * Safe to run multiple times; updates visibility if needed.
 *
 * Usage:
 *   npm run db:seed:buckets
 */

import postgres from "postgres";

const BUCKET_NAMES = {
  avatars: "avatars",
  paymentProofs: "payment-proofs",
  courtPhotos: "court-photos",
  placePhotos: "place-photos",
  organizationAssets: "organization-assets",
} as const;

interface BucketDefinition {
  id: string;
  name: string;
  public: boolean;
}

const BUCKET_DEFINITIONS: BucketDefinition[] = [
  { id: BUCKET_NAMES.avatars, name: BUCKET_NAMES.avatars, public: true },
  {
    id: BUCKET_NAMES.paymentProofs,
    name: BUCKET_NAMES.paymentProofs,
    public: true,
  },
  {
    id: BUCKET_NAMES.courtPhotos,
    name: BUCKET_NAMES.courtPhotos,
    public: true,
  },
  {
    id: BUCKET_NAMES.placePhotos,
    name: BUCKET_NAMES.placePhotos,
    public: true,
  },
  {
    id: BUCKET_NAMES.organizationAssets,
    name: BUCKET_NAMES.organizationAssets,
    public: true,
  },
];

interface BucketRow {
  id: string;
  name: string;
  public: boolean;
}

async function seed() {
  console.log("Starting storage bucket seed...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  try {
    let bucketsCreated = 0;
    let bucketsUpdated = 0;
    let bucketsSkipped = 0;

    await client.begin(async (sql) => {
      for (const bucket of BUCKET_DEFINITIONS) {
        const existing = await sql<BucketRow[]>`
          select id, name, public
          from storage.buckets
          where id = ${bucket.id}
        `;

        if (existing.length === 0) {
          await sql`
            insert into storage.buckets (id, name, public)
            values (${bucket.id}, ${bucket.name}, ${bucket.public})
          `;
          console.log(`  Created: ${bucket.id}`);
          bucketsCreated++;
          continue;
        }

        const current = existing[0];
        const needsUpdate =
          current.name !== bucket.name || current.public !== bucket.public;

        if (needsUpdate) {
          await sql`
            update storage.buckets
            set name = ${bucket.name}, public = ${bucket.public}
            where id = ${bucket.id}
          `;
          console.log(`  Updated: ${bucket.id}`);
          bucketsUpdated++;
        } else {
          console.log(`  Skipped: ${bucket.id} (already configured)`);
          bucketsSkipped++;
        }
      }
    });

    console.log("\n--- Bucket Seed Summary ---");
    console.log(`Buckets created: ${bucketsCreated}`);
    console.log(`Buckets updated: ${bucketsUpdated}`);
    console.log(`Buckets skipped: ${bucketsSkipped}`);
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
