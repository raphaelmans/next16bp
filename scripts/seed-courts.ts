/**
 * Seed script for courts data
 *
 * Seeds the database with sample Philippine pickleball courts for development.
 * Does NOT seed users, profiles, or organizations.
 *
 * Usage:
 *   npm run db:seed
 *
 * Features:
 *   - Idempotent: Safe to run multiple times (skips existing courts by name)
 *   - Transaction-safe: All inserts in single transaction
 *   - Creates curated courts with contact info, photos, and amenities
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/shared/infra/db/schema";

// Types for seed data
interface CuratedCourtSeed {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  detail: {
    facebookUrl?: string;
    viberInfo?: string;
    instagramUrl?: string;
    websiteUrl?: string;
    otherContactInfo?: string;
  };
  amenities: string[];
  photoCount: number;
}

// Sample curated courts data (Philippine locations)
const curatedCourts: CuratedCourtSeed[] = [
  {
    name: "BGC Pickleball Courts",
    address: "5th Avenue corner 32nd Street, Bonifacio Global City",
    city: "Taguig",
    latitude: 14.5507,
    longitude: 121.0455,
    detail: {
      facebookUrl: "https://facebook.com/bgcpickleball",
      websiteUrl: "https://bgcpickleball.com",
    },
    amenities: ["Parking", "Restrooms", "Water Station", "Lighting"],
    photoCount: 2,
  },
  {
    name: "Makati Sports Club",
    address: "Ayala Avenue, Makati City",
    city: "Makati",
    latitude: 14.558,
    longitude: 121.0244,
    detail: {
      instagramUrl: "https://instagram.com/makatisportsclub",
      viberInfo: "09171234567",
    },
    amenities: ["Parking", "Locker Rooms", "Pro Shop", "Restrooms"],
    photoCount: 3,
  },
  {
    name: "Cebu City Sports Center",
    address: "Osmena Boulevard, Cebu City",
    city: "Cebu",
    latitude: 10.3157,
    longitude: 123.8854,
    detail: {
      facebookUrl: "https://facebook.com/cebusportscenter",
    },
    amenities: ["Parking", "Spectator Seating", "Water Station"],
    photoCount: 2,
  },
  {
    name: "Davao Pickleball Hub",
    address: "JP Laurel Avenue, Davao City",
    city: "Davao",
    latitude: 7.0731,
    longitude: 125.6128,
    detail: {
      websiteUrl: "https://davaopickleball.ph",
      viberInfo: "09189876543",
    },
    amenities: ["Covered Courts", "Equipment Rental", "Parking"],
    photoCount: 2,
  },
  {
    name: "Clark Pickleball Arena",
    address: "Clark Freeport Zone, Angeles City",
    city: "Pampanga",
    latitude: 15.1852,
    longitude: 120.5601,
    detail: {
      facebookUrl: "https://facebook.com/clarkpickleball",
      instagramUrl: "https://instagram.com/clarkpickleballarena",
    },
    amenities: ["Parking", "Ball Machine Rental", "Pro Shop", "Lighting"],
    photoCount: 3,
  },
  {
    name: "Quezon City Memorial Circle Courts",
    address: "Elliptical Road, Quezon City",
    city: "Quezon City",
    latitude: 14.6517,
    longitude: 121.0498,
    detail: {
      facebookUrl: "https://facebook.com/qcmcpickleball",
      otherContactInfo: "Open daily 6AM-9PM. First come, first served.",
    },
    amenities: ["Parking", "Restrooms", "Lighting", "Water Station"],
    photoCount: 2,
  },
  {
    name: "SM Seaside Cebu Courts",
    address: "SM Seaside City Cebu, South Road Properties",
    city: "Cebu",
    latitude: 10.2814,
    longitude: 123.8603,
    detail: {
      facebookUrl: "https://facebook.com/smseasidepickleball",
      websiteUrl: "https://smsupermalls.com/seaside-cebu",
    },
    amenities: ["Parking", "Pro Shop", "Equipment Rental", "Locker Rooms"],
    photoCount: 3,
  },
  {
    name: "Subic Bay Freeport Courts",
    address: "Rizal Highway, Subic Bay Freeport Zone",
    city: "Zambales",
    latitude: 14.7944,
    longitude: 120.2827,
    detail: {
      websiteUrl: "https://subicbay.ph/recreation",
      viberInfo: "09123456789",
    },
    amenities: ["Covered Courts", "Parking", "Spectator Seating"],
    photoCount: 2,
  },
];

// Generate placeholder photo URL
const getPhotoUrl = (courtIndex: number, photoIndex: number): string =>
  `https://picsum.photos/seed/court${courtIndex}photo${photoIndex}/800/600`;

async function seed() {
  console.log("Starting court seed...\n");

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    let courtsCreated = 0;
    let courtsSkipped = 0;
    let photosCreated = 0;
    let amenitiesCreated = 0;

    for (let i = 0; i < curatedCourts.length; i++) {
      const courtData = curatedCourts[i];

      // Check if court already exists by name
      const existingCourt = await db.query.court.findFirst({
        where: eq(schema.court.name, courtData.name),
      });

      if (existingCourt) {
        console.log(`  Skipping: "${courtData.name}" (already exists)`);
        courtsSkipped++;
        continue;
      }

      console.log(`  Creating: "${courtData.name}" in ${courtData.city}`);

      // Create court
      const [newCourt] = await db
        .insert(schema.court)
        .values({
          name: courtData.name,
          address: courtData.address,
          city: courtData.city,
          latitude: courtData.latitude.toString(),
          longitude: courtData.longitude.toString(),
          courtType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: true,
          organizationId: null,
        })
        .returning();

      courtsCreated++;

      // Create curated court detail
      await db.insert(schema.curatedCourtDetail).values({
        courtId: newCourt.id,
        facebookUrl: courtData.detail.facebookUrl ?? null,
        viberInfo: courtData.detail.viberInfo ?? null,
        instagramUrl: courtData.detail.instagramUrl ?? null,
        websiteUrl: courtData.detail.websiteUrl ?? null,
        otherContactInfo: courtData.detail.otherContactInfo ?? null,
      });

      // Create photos
      for (let p = 0; p < courtData.photoCount; p++) {
        await db.insert(schema.courtPhoto).values({
          courtId: newCourt.id,
          url: getPhotoUrl(i, p),
          displayOrder: p,
        });
        photosCreated++;
      }

      // Create amenities
      for (const amenityName of courtData.amenities) {
        await db.insert(schema.courtAmenity).values({
          courtId: newCourt.id,
          name: amenityName,
        });
        amenitiesCreated++;
      }
    }

    console.log("\n--- Seed Summary ---");
    console.log(`Courts created: ${courtsCreated}`);
    console.log(`Courts skipped: ${courtsSkipped}`);
    console.log(`Photos created: ${photosCreated}`);
    console.log(`Amenities created: ${amenitiesCreated}`);
    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
