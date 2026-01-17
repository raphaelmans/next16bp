/**
 * Import script for curated courts from CSV.
 *
 * Usage:
 *   pnpm db:import:curated-courts -- --dry-run
 *   pnpm db:import:curated-courts -- --file scripts/templates/curated-courts-template.csv
 *
 * CSV columns:
 *   name,address,city,province,country,time_zone,latitude,longitude,facebook_url,instagram_url,
 *   viber_contact,website_url,other_contact_info,amenities,courts,photo_urls
 *
 * Courts format (semicolon separated):
 *   - sport_slug
 *   - sport_slug|tier_label
 *   - label|sport_slug|tier_label
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/shared/infra/db/schema";

interface ImportOptions {
  filePath: string;
  dryRun: boolean;
  continueOnError: boolean;
}

interface ParsedCourt {
  label: string;
  sportId: string;
  tierLabel: string | null;
}

interface ParsedRow {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  timeZone: string;
  latitude: number | null;
  longitude: number | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  viberInfo: string | null;
  websiteUrl: string | null;
  otherContactInfo: string | null;
  amenities: string[];
  courts: ParsedCourt[];
  photoUrls: string[];
}

const DEFAULT_FILE = "scripts/templates/curated-courts-template.csv";
const REQUIRED_COLUMNS = [
  "name",
  "address",
  "city",
  "province",
  "courts",
] as const;

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    filePath: DEFAULT_FILE,
    dryRun: false,
    continueOnError: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--continue-on-error") {
      options.continueOnError = true;
      continue;
    }
    if (arg === "--file") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("--file requires a path value");
      }
      options.filePath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--file=")) {
      options.filePath = arg.replace("--file=", "");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        const next = content[i + 1];
        if (next === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => cell.trim().length > 0));
}

function buildHeaderMap(headers: string[]): Map<string, number> {
  return new Map(
    headers.map((header, index) => [header.trim().toLowerCase(), index]),
  );
}

function getValue(
  row: string[],
  headerMap: Map<string, number>,
  key: string,
): string {
  const index = headerMap.get(key);
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

function parseOptionalNumber(
  value: string,
  label: string,
  rowLabel: string,
): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${rowLabel}: ${label} must be a valid number`);
  }
  return parsed;
}

function parseList(value: string, separator: string): string[] {
  if (!value) return [];
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.href.length > 0;
  } catch {
    return false;
  }
}

function parseCourts(
  value: string,
  rowLabel: string,
  sportIdsBySlug: Map<string, string>,
): ParsedCourt[] {
  const units = parseList(value, ";");
  if (units.length === 0) {
    throw new Error(`${rowLabel}: courts is required`);
  }

  const labels = new Set<string>();

  return units.map((unit, index) => {
    const parts = unit.split("|").map((part) => part.trim());

    if (parts.length > 3) {
      throw new Error(`${rowLabel}: invalid court format "${unit}"`);
    }

    if (parts.every((part) => part.length === 0)) {
      throw new Error(`${rowLabel}: empty court entry`);
    }

    let label: string | undefined;
    let sportSlug: string | undefined;
    let tierLabel: string | undefined;

    if (parts.length === 1) {
      sportSlug = parts[0];
    } else if (parts.length === 2) {
      const [first, second] = parts;
      if (sportIdsBySlug.has(first)) {
        sportSlug = first;
        tierLabel = second || undefined;
      } else if (sportIdsBySlug.has(second)) {
        label = first || undefined;
        sportSlug = second;
      } else {
        sportSlug = first;
        tierLabel = second || undefined;
      }
    } else {
      const [first, second, third] = parts;
      label = first || undefined;
      sportSlug = second;
      tierLabel = third || undefined;
    }

    if (!sportSlug) {
      throw new Error(`${rowLabel}: missing sport slug in courts`);
    }

    const sportId = sportIdsBySlug.get(sportSlug);
    if (!sportId) {
      throw new Error(`${rowLabel}: unknown sport slug "${sportSlug}"`);
    }

    const resolvedLabel =
      label && label.length > 0 ? label : `Court ${index + 1}`;
    if (labels.has(resolvedLabel)) {
      throw new Error(`${rowLabel}: duplicate court label "${resolvedLabel}"`);
    }

    labels.add(resolvedLabel);

    return {
      label: resolvedLabel,
      sportId,
      tierLabel: tierLabel && tierLabel.length > 0 ? tierLabel : null,
    };
  });
}

function parseRow(
  row: string[],
  headerMap: Map<string, number>,
  sportIdsBySlug: Map<string, string>,
  rowLabel: string,
): ParsedRow {
  const name = getValue(row, headerMap, "name");
  const address = getValue(row, headerMap, "address");
  const city = getValue(row, headerMap, "city");

  const province = getValue(row, headerMap, "province");

  if (!name || !address || !city || !province) {
    throw new Error(
      `${rowLabel}: name, address, city, and province are required`,
    );
  }
  const country = getValue(row, headerMap, "country") || "PH";
  const timeZone = getValue(row, headerMap, "time_zone") || "Asia/Manila";
  const latitude = parseOptionalNumber(
    getValue(row, headerMap, "latitude"),
    "latitude",
    rowLabel,
  );
  const longitude = parseOptionalNumber(
    getValue(row, headerMap, "longitude"),
    "longitude",
    rowLabel,
  );

  const facebookUrl = getValue(row, headerMap, "facebook_url");
  const instagramUrl = getValue(row, headerMap, "instagram_url");
  const viberInfo = getValue(row, headerMap, "viber_contact");
  const websiteUrl = getValue(row, headerMap, "website_url");
  const otherContactInfo = getValue(row, headerMap, "other_contact_info");

  const amenities = parseList(getValue(row, headerMap, "amenities"), ";");
  const courts = parseCourts(
    getValue(row, headerMap, "courts"),
    rowLabel,
    sportIdsBySlug,
  );
  const photoUrls = parseList(getValue(row, headerMap, "photo_urls"), ",");

  const invalidPhotoUrls = photoUrls.filter((url) => !isValidUrl(url));
  if (invalidPhotoUrls.length > 0) {
    throw new Error(`${rowLabel}: invalid photo URL(s)`);
  }

  return {
    name,
    address,
    city,
    province,
    country,
    timeZone,
    latitude,
    longitude,
    facebookUrl: facebookUrl || null,
    instagramUrl: instagramUrl || null,
    viberInfo: viberInfo || null,
    websiteUrl: websiteUrl || null,
    otherContactInfo: otherContactInfo || null,
    amenities,
    courts,
    photoUrls,
  };
}

async function importCuratedCourts() {
  const options = parseArgs();
  const resolvedPath = path.resolve(process.cwd(), options.filePath);

  console.log("Starting curated court import...\n");
  console.log(`File: ${resolvedPath}`);
  if (options.dryRun) {
    console.log("Mode: dry run (no database writes)\n");
  }

  const fileContent = await readFile(resolvedPath, "utf-8");
  const rows = parseCsv(fileContent);
  if (rows.length < 2) {
    throw new Error("CSV has no data rows to import");
  }

  const headerMap = buildHeaderMap(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headerMap.has(column),
  );
  if (missingColumns.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missingColumns.join(", ")}`,
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    const sports = await db
      .select({ id: schema.sport.id, slug: schema.sport.slug })
      .from(schema.sport);
    const sportIdsBySlug = new Map(
      sports.map((sport) => [sport.slug, sport.id]),
    );

    if (sportIdsBySlug.size === 0) {
      throw new Error("No sports found. Run db:seed:sports first.");
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;
    let validated = 0;

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNumber = i + 1;
      const namePreview = getValue(row, headerMap, "name");
      const rowLabel = `Row ${rowNumber}${namePreview ? ` (${namePreview})` : ""}`;

      try {
        const parsed = parseRow(row, headerMap, sportIdsBySlug, rowLabel);

        const existing = await db.query.place.findFirst({
          where: and(
            ilike(schema.place.name, parsed.name),
            ilike(schema.place.city, parsed.city),
          ),
        });

        if (existing) {
          console.log(`  Skipped duplicate: ${parsed.name} (${parsed.city})`);
          skipped += 1;
          continue;
        }

        if (options.dryRun) {
          console.log(`  Validated: ${parsed.name} (${parsed.city})`);
          validated += 1;
          continue;
        }

        await db.transaction(async (tx) => {
          const placeValues: typeof schema.place.$inferInsert = {
            name: parsed.name,
            address: parsed.address,
            city: parsed.city,
            province: parsed.province,
            country: parsed.country,
            latitude:
              parsed.latitude !== null ? parsed.latitude.toString() : undefined,
            longitude:
              parsed.longitude !== null
                ? parsed.longitude.toString()
                : undefined,
            timeZone: parsed.timeZone,
            placeType: "CURATED",
            claimStatus: "UNCLAIMED",
            isActive: true,
          };

          const [placeRecord] = await tx
            .insert(schema.place)
            .values(placeValues)
            .returning();

          if (!placeRecord) {
            throw new Error(`${rowLabel}: failed to create place record`);
          }

          const hasContactDetail =
            parsed.facebookUrl ||
            parsed.instagramUrl ||
            parsed.viberInfo ||
            parsed.websiteUrl ||
            parsed.otherContactInfo;

          if (hasContactDetail) {
            await tx.insert(schema.placeContactDetail).values({
              placeId: placeRecord.id,
              facebookUrl: parsed.facebookUrl ?? undefined,
              instagramUrl: parsed.instagramUrl ?? undefined,
              viberInfo: parsed.viberInfo ?? undefined,
              websiteUrl: parsed.websiteUrl ?? undefined,
              otherContactInfo: parsed.otherContactInfo ?? undefined,
            });
          }

          if (parsed.amenities.length > 0) {
            await tx
              .insert(schema.placeAmenity)
              .values(
                parsed.amenities.map((name) => ({
                  placeId: placeRecord.id,
                  name,
                })),
              )
              .onConflictDoNothing();
          }

          await tx
            .insert(schema.court)
            .values(
              parsed.courts.map((court) => ({
                placeId: placeRecord.id,
                sportId: court.sportId,
                label: court.label,
                tierLabel: court.tierLabel,
                isActive: true,
              })),
            )
            .onConflictDoNothing();

          if (parsed.photoUrls.length > 0) {
            await tx.insert(schema.placePhoto).values(
              parsed.photoUrls.map((url, index) => ({
                placeId: placeRecord.id,
                url,
                displayOrder: index,
              })),
            );
          }
        });

        console.log(`  Created: ${parsed.name} (${parsed.city})`);
        created += 1;
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : "Unknown import error";
        console.error(`  Failed: ${rowLabel} -> ${message}`);

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    console.log("\n--- Import Summary ---");
    if (options.dryRun) {
      console.log(`Rows validated: ${validated}`);
    } else {
      console.log(`Places created: ${created}`);
    }
    console.log(`Places skipped: ${skipped}`);
    console.log(`Rows failed: ${failed}`);
    console.log("\nImport completed successfully!");
  } finally {
    await client.end();
  }
}

importCuratedCourts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
