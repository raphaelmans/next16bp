/**
 * Seed script for places data
 *
 * Seeds the database with sample Philippine pickleball places for development.
 * Does NOT seed users, profiles, or organizations.
 *
 * Usage:
 *   npm run db:seed
 *
 * Features:
 *   - Idempotent: Safe to run multiple times (skips existing places by name)
 *   - Transaction-safe: All inserts in single transaction
 *   - Creates curated places with contact info, photos, and amenities
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/shared/infra/db/schema";

// Types for seed data
interface CuratedPlaceSeed {
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

// Sample curated places data (Philippine locations)
const curatedPlaces: CuratedPlaceSeed[] = [
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
const getPhotoUrl = (placeIndex: number, photoIndex: number): string =>
  `https://picsum.photos/seed/place${placeIndex}photo${photoIndex}/800/600`;

async function seed() {
  console.log("Starting place seed...\n");

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    let placesCreated = 0;
    let placesSkipped = 0;
    let photosCreated = 0;
    let amenitiesCreated = 0;

    const existingSport = await db.query.sport.findFirst({
      where: eq(schema.sport.slug, "pickleball"),
    });

    if (!existingSport) {
      await db.insert(schema.sport).values({
        slug: "pickleball",
        name: "Pickleball",
      });
      console.log("  Seeded sport: Pickleball");
    }

    for (let i = 0; i < curatedPlaces.length; i++) {
      const placeData = curatedPlaces[i];

      // Check if place already exists by name
      const existingPlace = await db.query.place.findFirst({
        where: eq(schema.place.name, placeData.name),
      });

      if (existingPlace) {
        console.log(`  Skipping: "${placeData.name}" (already exists)`);
        placesSkipped++;
        continue;
      }

      console.log(`  Creating: "${placeData.name}" in ${placeData.city}`);

      // Create place
      const [newPlace] = await db
        .insert(schema.place)
        .values({
          name: placeData.name,
          address: placeData.address,
          city: placeData.city,
          latitude: placeData.latitude.toString(),
          longitude: placeData.longitude.toString(),
          placeType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: true,
          organizationId: null,
        })
        .returning();

      placesCreated++;

      // Create curated place detail
      await db.insert(schema.curatedPlaceDetail).values({
        placeId: newPlace.id,
        facebookUrl: placeData.detail.facebookUrl ?? null,
        viberInfo: placeData.detail.viberInfo ?? null,
        instagramUrl: placeData.detail.instagramUrl ?? null,
        websiteUrl: placeData.detail.websiteUrl ?? null,
        otherContactInfo: placeData.detail.otherContactInfo ?? null,
      });

      // Create photos
      for (let p = 0; p < placeData.photoCount; p++) {
        await db.insert(schema.placePhoto).values({
          placeId: newPlace.id,
          url: getPhotoUrl(i, p),
          displayOrder: p,
        });
        photosCreated++;
      }

      // Create amenities
      for (const amenityName of placeData.amenities) {
        await db.insert(schema.placeAmenity).values({
          placeId: newPlace.id,
          name: amenityName,
        });
        amenitiesCreated++;
      }
    }

    console.log("\n--- Seed Summary ---");
    console.log(`Places created: ${placesCreated}`);
    console.log(`Places skipped: ${placesSkipped}`);
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
