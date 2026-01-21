/**
 * Export curated places to a sales-friendly CSV.
 *
 * Usage:
 *   pnpm db:export:curated-places
 *   pnpm db:export:curated-places -- --output scripts/output/curated-places-export.csv
 *   pnpm db:export:curated-places -- --unclaimed-only
 *   pnpm db:export:curated-places -- --stdout > curated-places-export.csv
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

interface ExportOptions {
  outputPath: string;
  stdout: boolean;
  unclaimedOnly: boolean;
}

const DEFAULT_OUTPUT = "scripts/output/curated-places-export.csv";

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  const options: ExportOptions = {
    outputPath: DEFAULT_OUTPUT,
    stdout: false,
    unclaimedOnly: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--stdout") {
      options.stdout = true;
      continue;
    }

    if (arg === "--unclaimed-only") {
      options.unclaimedOnly = true;
      continue;
    }

    if (arg === "--output") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("--output requires a path value");
      }
      options.outputPath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function escapeCsv(value: string): string {
  if (!value) return "";
  const needsQuotes = /[",\n\r]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function exportCuratedPlaces() {
  const options = parseArgs();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  const whereParts = ["p.place_type = 'CURATED'"];
  if (options.unclaimedOnly) {
    whereParts.push("p.claim_status = 'UNCLAIMED'");
  }

  const query = `
with amenities as (
  select place_id,
    string_agg(name, ';' order by name) as amenities
  from place_amenity
  group by place_id
),
photos as (
  select place_id,
    string_agg(url, ',' order by display_order, created_at) as photo_urls
  from place_photo
  group by place_id
),
courts as (
  select c.place_id,
    string_agg(
      concat_ws('|', c.label, s.slug, coalesce(c.tier_label, '')),
      ';'
      order by c.label
    ) as courts
  from court c
  join sport s on s.id = c.sport_id
  group by c.place_id
)
select
  p.id as place_id,
  p.name,
  p.address,
  p.city,
  p.province,
  p.country,
  p.time_zone,
  p.latitude,
  p.longitude,
  p.place_type,
  p.claim_status,
  p.is_active,
  o.name as organization_name,
  pcd.phone_number,
  pcd.viber_info,
  pcd.facebook_url,
  pcd.instagram_url,
  pcd.website_url,
  pcd.other_contact_info,
  coalesce(a.amenities, '') as amenities,
  coalesce(c.courts, '') as courts,
  coalesce(ph.photo_urls, '') as photo_urls
from place p
left join organization o on o.id = p.organization_id
left join place_contact_detail pcd on pcd.place_id = p.id
left join amenities a on a.place_id = p.id
left join courts c on c.place_id = p.id
left join photos ph on ph.place_id = p.id
where ${whereParts.join(" and ")}
order by p.created_at desc;
`.trim();

  try {
    const rows = (await client.unsafe(query)) as Array<Record<string, unknown>>;

    const headers = [
      "place_id",
      "name",
      "address",
      "city",
      "province",
      "country",
      "time_zone",
      "latitude",
      "longitude",
      "place_type",
      "claim_status",
      "is_active",
      "organization_name",
      "phone_number",
      "viber_info",
      "facebook_url",
      "instagram_url",
      "website_url",
      "other_contact_info",
      "amenities",
      "courts",
      "photo_urls",
    ] as const;

    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((key) => escapeCsv(toCsvValue(row[key]))).join(","),
      ),
    ];

    const csv = `${lines.join("\n")}\n`;

    if (options.stdout) {
      process.stdout.write(csv);
      return;
    }

    const resolvedOutput = path.resolve(process.cwd(), options.outputPath);
    await ensureDir(resolvedOutput);
    await writeFile(resolvedOutput, csv, "utf-8");

    console.log(`Wrote ${rows.length} rows to ${resolvedOutput}`);
  } finally {
    await client.end();
  }
}

exportCuratedPlaces()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
