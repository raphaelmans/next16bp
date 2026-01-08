# Phase 3: CSV Import Script

**Dependencies:** None (independent of Phases 1-2)  
**Parallelizable:** Can run in parallel with Phase 2  
**User Stories:** US-02-04

---

## Objective

Create a CLI script that imports curated courts from a CSV file with:
- Transaction safety (all or nothing)
- Duplicate detection and skipping
- Validation before insert
- Clear logging and summary

---

## Script Location

```
scripts/import-curated-courts.ts
```

---

## Usage

```bash
# Basic import
npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv

# Verbose mode
npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv --verbose
```

---

## CSV Format

### Header Row

```csv
name,address,city,latitude,longitude,facebook_url,instagram_url,viber_contact,website_url,other_contact_info,amenities
```

### Sample Data

See `scripts/templates/curated-courts-template.csv`:

```csv
name,address,city,latitude,longitude,facebook_url,instagram_url,viber_contact,website_url,other_contact_info,amenities
"Makati Pickleball Club","123 Sports Avenue, Barangay San Lorenzo","Makati","14.5547","121.0244","https://facebook.com/makatipb","https://instagram.com/makatipb","0917 123 4567","https://makatipb.com","Open daily 6AM-10PM. Walk-ins welcome.","Parking;Restrooms;Lights;Covered Courts"
"BGC Court Center","45 High Street, Fort Bonifacio","BGC","14.5503","121.0455","https://facebook.com/bgccourts","","","","Contact via Facebook Messenger for reservations","Parking;Lights;Food/Drinks"
```

---

## Implementation

```typescript
// scripts/import-curated-courts.ts
/**
 * CSV Import Script for Curated Courts
 *
 * Imports curated courts from a CSV file into the database.
 * Uses transactions for data integrity and skips duplicates.
 *
 * Usage:
 *   npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv
 *   npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv --verbose
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import * as schema from "../src/shared/infra/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CITIES = [
  "Makati",
  "BGC",
  "Pasig",
  "Quezon City",
  "Manila",
  "Taguig",
  "Mandaluyong",
  "San Juan",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Alabang",
];

const VALID_AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "WiFi",
  "Air Conditioning",
  "Covered Courts",
];

const DEFAULT_LATITUDE = "14.5995";
const DEFAULT_LONGITUDE = "120.9842";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CsvRow {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  facebook_url: string;
  instagram_url: string;
  viber_contact: string;
  website_url: string;
  other_contact_info: string;
  amenities: string;
}

interface ParsedCourt {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  viberInfo: string | null;
  websiteUrl: string | null;
  otherContactInfo: string | null;
  amenities: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationWarning {
  row: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): { file: string; verbose: boolean } {
  const args = process.argv.slice(2);
  let file = "";
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      file = args[i + 1];
      i++;
    } else if (args[i] === "--verbose") {
      verbose = true;
    }
  }

  if (!file) {
    console.error("Usage: npx tsx scripts/import-curated-courts.ts --file <path> [--verbose]");
    process.exit(1);
  }

  return { file, verbose };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  const headers = parseCsvLine(lines[0]);
  const expectedHeaders = [
    "name",
    "address",
    "city",
    "latitude",
    "longitude",
    "facebook_url",
    "instagram_url",
    "viber_contact",
    "website_url",
    "other_contact_info",
    "amenities",
  ];

  // Validate headers
  for (const expected of expectedHeaders) {
    if (!headers.includes(expected)) {
      throw new Error(`Missing required header: ${expected}`);
    }
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row as CsvRow);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateRows(rows: CsvRow[]): {
  valid: ParsedCourt[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const valid: ParsedCourt[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Account for header row and 1-based indexing
    const rowErrors: ValidationError[] = [];

    // Required: name
    if (!row.name.trim()) {
      rowErrors.push({ row: rowNum, field: "name", message: "Name is required" });
    }

    // Required: address
    if (!row.address.trim()) {
      rowErrors.push({ row: rowNum, field: "address", message: "Address is required" });
    }

    // Required: city (must be valid)
    if (!row.city.trim()) {
      rowErrors.push({ row: rowNum, field: "city", message: "City is required" });
    } else if (!VALID_CITIES.includes(row.city.trim())) {
      rowErrors.push({
        row: rowNum,
        field: "city",
        message: `Invalid city "${row.city}". Valid cities: ${VALID_CITIES.join(", ")}`,
      });
    }

    // Optional: latitude (validate if provided)
    if (row.latitude.trim() && isNaN(parseFloat(row.latitude))) {
      rowErrors.push({
        row: rowNum,
        field: "latitude",
        message: "Latitude must be a valid number",
      });
    }

    // Optional: longitude (validate if provided)
    if (row.longitude.trim() && isNaN(parseFloat(row.longitude))) {
      rowErrors.push({
        row: rowNum,
        field: "longitude",
        message: "Longitude must be a valid number",
      });
    }

    // Optional: URLs (validate if provided)
    const urlFields = ["facebook_url", "instagram_url", "website_url"] as const;
    for (const field of urlFields) {
      const value = row[field].trim();
      if (value && !isValidUrl(value)) {
        rowErrors.push({
          row: rowNum,
          field,
          message: `Invalid URL format for ${field}`,
        });
      }
    }

    // Parse amenities and warn about unknown ones
    const amenities: string[] = [];
    if (row.amenities.trim()) {
      const parts = row.amenities.split(";").map((a) => a.trim()).filter(Boolean);
      for (const amenity of parts) {
        if (VALID_AMENITIES.includes(amenity)) {
          amenities.push(amenity);
        } else {
          warnings.push({
            row: rowNum,
            message: `Unknown amenity "${amenity}" will be skipped`,
          });
        }
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push({
        name: row.name.trim(),
        address: row.address.trim(),
        city: row.city.trim(),
        latitude: row.latitude.trim() || DEFAULT_LATITUDE,
        longitude: row.longitude.trim() || DEFAULT_LONGITUDE,
        facebookUrl: row.facebook_url.trim() || null,
        instagramUrl: row.instagram_url.trim() || null,
        viberInfo: row.viber_contact.trim() || null,
        websiteUrl: row.website_url.trim() || null,
        otherContactInfo: row.other_contact_info.trim() || null,
        amenities,
      });
    }
  });

  return { valid, errors, warnings };
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Operations
// ─────────────────────────────────────────────────────────────────────────────

async function importCourts(
  db: ReturnType<typeof drizzle>,
  courts: ParsedCourt[],
  verbose: boolean
): Promise<{ created: number; skipped: number; amenitiesCreated: number }> {
  let created = 0;
  let skipped = 0;
  let amenitiesCreated = 0;

  await db.transaction(async (tx) => {
    for (const court of courts) {
      // Check for duplicate
      const existing = await tx.query.court.findFirst({
        where: and(
          eq(schema.court.name, court.name),
          eq(schema.court.city, court.city)
        ),
      });

      if (existing) {
        console.log(`  [SKIP] ${court.name} - already exists (${court.city})`);
        skipped++;
        continue;
      }

      // Insert court
      const [newCourt] = await tx
        .insert(schema.court)
        .values({
          name: court.name,
          address: court.address,
          city: court.city,
          latitude: court.latitude,
          longitude: court.longitude,
          courtType: "CURATED",
          claimStatus: "UNCLAIMED",
          isActive: true,
          organizationId: null,
        })
        .returning();

      // Insert curated detail
      await tx.insert(schema.curatedCourtDetail).values({
        courtId: newCourt.id,
        facebookUrl: court.facebookUrl,
        instagramUrl: court.instagramUrl,
        viberInfo: court.viberInfo,
        websiteUrl: court.websiteUrl,
        otherContactInfo: court.otherContactInfo,
      });

      // Insert amenities
      for (const amenity of court.amenities) {
        await tx.insert(schema.courtAmenity).values({
          courtId: newCourt.id,
          name: amenity,
        });
        amenitiesCreated++;
      }

      console.log(`  [CREATE] ${court.name} (${court.city})`);
      if (verbose) {
        console.log(`    - Court ID: ${newCourt.id}`);
        console.log(`    - Lat/Lng: ${court.latitude}, ${court.longitude}`);
        if (court.amenities.length > 0) {
          console.log(`    - Amenities: ${court.amenities.join(", ")}`);
        }
        const contacts = [
          court.facebookUrl && "Facebook",
          court.instagramUrl && "Instagram",
          court.viberInfo && "Viber",
          court.websiteUrl && "Website",
        ].filter(Boolean);
        if (contacts.length > 0) {
          console.log(`    - Contact: ${contacts.join(", ")}`);
        }
      }

      created++;
    }
  });

  return { created, skipped, amenitiesCreated };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const { file, verbose } = parseArgs();

  // Check file exists
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Parsing CSV: ${filePath}`);

  // Read and parse CSV
  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(content);
  console.log(`Found ${rows.length} rows to process\n`);

  // Validate
  console.log("Validating data...");
  const { valid, errors, warnings } = validateRows(rows);

  // Report warnings
  for (const warning of warnings) {
    console.log(`  Row ${warning.row}: WARNING - ${warning.message}`);
  }

  // Report errors
  if (errors.length > 0) {
    console.log("\nValidation errors:");
    for (const error of errors) {
      console.log(`  Row ${error.row}: ERROR - ${error.message}`);
    }
    console.log(`\nValidation failed with ${errors.length} error(s). No data was imported.`);
    console.log("Please fix the errors and try again.");
    process.exit(1);
  }

  console.log(`Validation complete: ${valid.length} valid, ${errors.length} errors\n`);

  // Connect to database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    console.log("Starting import transaction...");
    const result = await importCourts(db, valid, verbose);

    console.log("\n--- Import Summary ---");
    console.log(`Total rows: ${rows.length}`);
    console.log(`Created: ${result.created}`);
    console.log(`Skipped: ${result.skipped} (duplicates)`);
    console.log(`Amenities created: ${result.amenitiesCreated}`);
    console.log(`Transaction: COMMITTED`);
    console.log("\nImport completed successfully!");
  } catch (error) {
    console.error("\nImport failed:", error);
    console.log("Transaction: ROLLED BACK");
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

## Sample Template

Already created at `scripts/templates/curated-courts-template.csv` with 8 sample courts.

---

## Testing Checklist

### File Handling
- [ ] Handles missing file gracefully
- [ ] Handles empty file with error
- [ ] Handles file without data rows

### CSV Parsing
- [ ] Parses quoted values correctly
- [ ] Handles escaped quotes within values
- [ ] Handles empty values in optional columns

### Validation
- [ ] Rejects empty name
- [ ] Rejects empty address
- [ ] Rejects invalid city
- [ ] Warns on unknown amenities
- [ ] Validates URL format

### Database
- [ ] Creates court record
- [ ] Creates curated detail
- [ ] Creates amenities
- [ ] Skips duplicates
- [ ] Transaction commits on success
- [ ] Transaction rolls back on error

### Output
- [ ] Shows validation progress
- [ ] Shows import progress
- [ ] Shows correct summary counts
- [ ] Verbose mode shows additional details

---

## Handoff Notes

- Script is independent of web form (no tRPC)
- Uses same pattern as existing `scripts/seed-courts.ts`
- No additional npm packages required (uses built-in fs/path)
- Test with sample template before importing real data
