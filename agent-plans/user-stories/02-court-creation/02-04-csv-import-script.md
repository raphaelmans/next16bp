# US-02-04: CSV Import Script for Curated Courts

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -  
**Related:** US-02-03 (Admin Data Entry Form)

---

## Story

As an **admin**, I want to **import curated courts from a CSV file** so that **I can bulk populate the platform with court inventory**.

---

## Overview

A CLI script that reads a CSV file and imports curated courts into the database. Uses transactions for data integrity and skips duplicates.

---

## Script Location

`scripts/import-curated-courts.ts`

---

## Usage

```bash
# Basic import
npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv

# With verbose logging
npx tsx scripts/import-curated-courts.ts --file ./data/courts.csv --verbose
```

---

## Acceptance Criteria

### Valid CSV Import

- Given I have a valid CSV file with court data
- When I run `npx tsx scripts/import-curated-courts.ts --file courts.csv`
- Then all valid courts are inserted into the database
- And I see a summary of created/skipped courts

### Transaction Safety

- Given I am importing courts
- When any row fails validation or insert
- Then the entire transaction is rolled back
- And no partial data is inserted

### Duplicate Handling

- Given a court with the same `name + city` already exists
- When I try to import it
- Then the row is skipped
- And a warning is logged

### Validation Before Insert

- Given I have a CSV file
- When I run the import
- Then all rows are validated before any database insert
- And validation errors are reported upfront

### Missing File

- Given the specified file does not exist
- When I run the import
- Then I see an error message
- And the script exits with code 1

---

## CSV Format

### Header Row (Required)

```csv
name,address,city,latitude,longitude,facebook_url,instagram_url,viber_contact,website_url,other_contact_info,amenities
```

### Data Rows

```csv
"Makati Pickleball Club","123 Sports Ave, San Lorenzo","Makati","14.5547","121.0244","https://facebook.com/makatipb","https://instagram.com/makatipb","0917 123 4567","https://makatipb.com","Open 6AM-10PM daily","Parking;Restrooms;Lights"
"BGC Court Center","45 High Street, Fort Bonifacio","BGC","","","https://facebook.com/bgccourts","","","","Contact via FB Messenger","Parking;Lights;Food/Drinks"
```

---

## Field Mapping

| CSV Column | DB Table.Field | Required | Default Value |
|------------|----------------|----------|---------------|
| name | court.name | Yes | - |
| address | court.address | Yes | - |
| city | court.city | Yes | - |
| latitude | court.latitude | No | "14.5995" |
| longitude | court.longitude | No | "120.9842" |
| facebook_url | curated_court_detail.facebook_url | No | null |
| instagram_url | curated_court_detail.instagram_url | No | null |
| viber_contact | curated_court_detail.viber_info | No | null |
| website_url | curated_court_detail.website_url | No | null |
| other_contact_info | curated_court_detail.other_contact_info | No | null |
| amenities | court_amenity (multiple rows) | No | none |

---

## Validation Rules

### Required Fields

| Field | Rule |
|-------|------|
| name | Non-empty, max 200 chars |
| address | Non-empty |
| city | Must be in predefined cities list |

### Optional Fields

| Field | Rule |
|-------|------|
| latitude | Valid decimal number or empty |
| longitude | Valid decimal number or empty |
| facebook_url | Valid URL or empty |
| instagram_url | Valid URL or empty |
| viber_contact | Max 100 chars |
| website_url | Valid URL or empty |
| other_contact_info | Any string |
| amenities | Semicolon-separated, warn on unknown amenities |

### Valid Cities

```typescript
const VALID_CITIES = [
  "Makati", "BGC", "Pasig", "Quezon City", "Manila", "Taguig", 
  "Mandaluyong", "San Juan", "Parañaque", "Las Piñas", "Muntinlupa", "Alabang"
];
```

### Valid Amenities

```typescript
const VALID_AMENITIES = [
  "Parking", "Restrooms", "Lights", "Showers", "Locker Rooms", 
  "Equipment Rental", "Pro Shop", "Seating Area", "Food/Drinks", 
  "WiFi", "Air Conditioning", "Covered Courts"
];
```

---

## Script Behavior

### Execution Flow

```
1. Parse CLI arguments
2. Check file exists
3. Parse CSV file
4. Validate all rows (collect errors)
5. If validation errors: report and exit
6. Check for duplicates in database
7. Start transaction
8. Insert courts (skip duplicates)
9. Commit transaction
10. Print summary
```

### Duplicate Detection

Duplicates are detected by matching `name` AND `city`:

```typescript
const existing = await db.query.court.findFirst({
  where: and(
    eq(schema.court.name, row.name),
    eq(schema.court.city, row.city)
  ),
});
```

### Insert Order (per court)

```
1. Insert into `court` table
2. Insert into `curated_court_detail` table
3. Insert into `court_amenity` table (multiple rows)
```

---

## Expected Output

### Successful Import

```
Parsing CSV: ./data/courts.csv
Found 15 rows to process

Validating data...
  Row 1: OK
  Row 2: OK
  Row 3: WARNING - Unknown amenity "Ball Machine" (will be skipped)
  ...
Validation complete: 15 valid, 0 errors

Checking for duplicates...
  Found 3 existing courts to skip

Starting import transaction...
  [CREATE] Makati Pickleball Club (Makati)
  [CREATE] Pasig Sports Hub (Pasig)
  [SKIP] BGC Court Center - already exists (BGC)
  [CREATE] Quezon City Memorial Courts (Quezon City)
  ...

--- Import Summary ---
Total rows: 15
Created: 12
Skipped: 3 (duplicates)
Amenities created: 36
Transaction: COMMITTED

Import completed successfully!
```

### Validation Errors

```
Parsing CSV: ./data/courts.csv
Found 15 rows to process

Validating data...
  Row 1: OK
  Row 2: ERROR - City "Unknown City" is not valid
  Row 3: ERROR - Name is required
  Row 5: ERROR - Invalid URL format for facebook_url
  ...

Validation failed with 3 errors. No data was imported.
Please fix the errors and try again.
```

### Verbose Mode

With `--verbose` flag, additional details are logged:

```
  [CREATE] Makati Pickleball Club (Makati)
    - Court ID: 550e8400-e29b-41d4-a716-446655440000
    - Lat/Lng: 14.5547, 121.0244
    - Amenities: Parking, Restrooms, Lights
    - Contact: Facebook, Instagram, Viber
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/import-curated-courts.ts` | Main import script |
| `scripts/templates/curated-courts-template.csv` | Sample CSV template with example data |

---

## Implementation Notes

### Pattern Reference

Based on existing `scripts/seed-courts.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/shared/infra/db/schema";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle({ client, casing: "snake_case", schema });
```

### CSV Parsing

Use a simple CSV parser (e.g., `csv-parse` or manual parsing):

```typescript
import { parse } from "csv-parse/sync";
import fs from "fs";

const content = fs.readFileSync(filePath, "utf-8");
const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});
```

### Transaction Usage

```typescript
await db.transaction(async (tx) => {
  for (const row of validRows) {
    if (isDuplicate(row)) {
      console.log(`  [SKIP] ${row.name} - already exists`);
      continue;
    }
    
    // Insert court
    const [court] = await tx.insert(schema.court).values({...}).returning();
    
    // Insert curated detail
    await tx.insert(schema.curatedCourtDetail).values({
      courtId: court.id,
      ...
    });
    
    // Insert amenities
    for (const amenity of row.amenities) {
      await tx.insert(schema.courtAmenity).values({
        courtId: court.id,
        name: amenity,
      });
    }
    
    console.log(`  [CREATE] ${row.name} (${row.city})`);
  }
});
```

---

## Sample CSV Template

See `scripts/templates/curated-courts-template.csv`:

```csv
name,address,city,latitude,longitude,facebook_url,instagram_url,viber_contact,website_url,other_contact_info,amenities
"Example Court 1","123 Main Street, Barangay San Lorenzo","Makati","14.5547","121.0244","https://facebook.com/example1","https://instagram.com/example1","0917 123 4567","https://example1.com","Open daily 6AM-10PM","Parking;Restrooms;Lights;Covered Courts"
"Example Court 2","456 High Street, Fort Bonifacio","BGC","14.5503","121.0455","https://facebook.com/example2","","","","Contact via Facebook","Parking;Lights;Food/Drinks"
"Example Court 3","789 Ortigas Ave","Pasig","","","","","0918 765 4321","","","Restrooms;Parking"
```

---

## Testing Checklist

- [ ] Script runs with valid CSV
- [ ] Script fails gracefully with missing file
- [ ] Script fails gracefully with invalid CSV format
- [ ] Validation errors are reported before any insert
- [ ] Transaction rolls back on error
- [ ] Duplicates are skipped with warning
- [ ] All fields are correctly mapped
- [ ] Amenities are split and inserted correctly
- [ ] Default lat/lng is used when empty
- [ ] Summary shows correct counts
- [ ] Verbose mode shows additional details

---

## Dependencies

```bash
# If not already installed
npm install csv-parse
```

Or use the simpler approach with manual parsing (no additional deps).

---

## References

- Existing seed script: `scripts/seed-courts.ts`
- Database schema: `src/shared/infra/db/schema/court.ts`
- PRD: Section 5.2 (Curated Courts)
