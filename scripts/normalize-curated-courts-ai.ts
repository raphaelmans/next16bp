/**
 * Normalize curated court crawl artifacts into import-ready CSV using AI structured output.
 *
 * Pipeline:
 *   crawl -> raw JSON -> normalize (this script) -> CSV (+ unresolved CSV)
 *
 * Usage:
 *   pnpm scrape:curated:normalize -- --input scripts/output/sports360-curated-courts.raw.json
 *   pnpm scrape:curated:normalize -- --input scripts/output/pickleheads-curated-courts.raw.json
 *   pnpm scrape:curated:normalize -- --input <raw.json> --model gpt-5-mini
 *   pnpm scrape:curated:normalize -- --input <raw.json> --dry-run
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

interface ScriptOptions {
  inputPath: string;
  outputPath: string;
  unresolvedOutputPath: string;
  reportOutputPath: string;
  model: string;
  phLocationsPath: string;
  sportSlug: string;
  batchSize: number;
  dryRun: boolean;
}

interface CuratedCsvRow {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  time_zone: string;
  latitude: string;
  longitude: string;
  facebook_url: string;
  instagram_url: string;
  viber_contact: string;
  website_url: string;
  other_contact_info: string;
  amenities: string;
  courts: string;
  photo_urls: string;
}

interface RowWithSource {
  row: CuratedCsvRow;
  sourceUrl: string;
}

interface CrawlRawOutput {
  generatedAt?: string;
  startUrl?: string;
  sportSlug?: string;
  rawRecords?: RowWithSource[];
}

interface PHLocationCity {
  name: string;
  displayName: string;
  slug: string;
}

interface PHLocationProvince extends PHLocationCity {
  cities: PHLocationCity[];
}

interface UnresolvedRecord {
  sourceUrl: string;
  name: string;
  address: string;
  city: string;
  province: string;
  reason: string;
  confidence: string;
}

const CSV_HEADERS: (keyof CuratedCsvRow)[] = [
  "name",
  "address",
  "city",
  "province",
  "country",
  "time_zone",
  "latitude",
  "longitude",
  "facebook_url",
  "instagram_url",
  "viber_contact",
  "website_url",
  "other_contact_info",
  "amenities",
  "courts",
  "photo_urls",
];

const UNRESOLVED_HEADERS = [
  "source_url",
  "name",
  "address",
  "city",
  "province",
  "reason",
  "confidence",
] as const;

const AI_NORMALIZED_ROW_SCHEMA = z.object({
  index: z.number().int().min(0),
  status: z.enum(["accepted", "unresolved"]),
  confidence: z.enum(["high", "medium", "low"]).optional().nullable(),
  reason: z.string().optional().nullable(),
  normalized: z
    .object({
      name: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      provinceName: z.string().optional().nullable(),
      cityName: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      timeZone: z.string().optional().nullable(),
      latitude: z.union([z.string(), z.number()]).optional().nullable(),
      longitude: z.union([z.string(), z.number()]).optional().nullable(),
      facebookUrl: z.string().optional().nullable(),
      instagramUrl: z.string().optional().nullable(),
      viberContact: z.string().optional().nullable(),
      websiteUrl: z.string().optional().nullable(),
      otherContactInfo: z.string().optional().nullable(),
      amenities: z.array(z.string()).optional().nullable(),
      courts: z.array(z.string()).optional().nullable(),
      photoUrls: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .nullable(),
});

const AI_NORMALIZATION_BATCH_SCHEMA = z.object({
  rows: z.array(AI_NORMALIZED_ROW_SCHEMA),
});

const DEFAULT_OPTIONS: ScriptOptions = {
  inputPath: "scripts/output/sports360-curated-courts.raw.json",
  outputPath: "scripts/output/sports360-curated-courts.normalized.csv",
  unresolvedOutputPath:
    "scripts/output/sports360-curated-courts.unresolved.csv",
  reportOutputPath:
    "scripts/output/sports360-curated-courts.normalize-report.json",
  model: "gpt-5-mini",
  phLocationsPath: "public/assets/files/ph-provinces-cities.enriched.json",
  sportSlug: "pickleball",
  batchSize: 20,
  dryRun: false,
};

function parseNumber(
  rawValue: string | undefined,
  flagName: string,
  defaultValue: number,
): number {
  if (!rawValue) return defaultValue;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive number`);
  }
  return parsed;
}

function deriveOutputPaths(inputPath: string): {
  outputPath: string;
  unresolvedOutputPath: string;
  reportOutputPath: string;
} {
  const base = inputPath.endsWith(".raw.json")
    ? inputPath.replace(/\.raw\.json$/, "")
    : inputPath.replace(/\.json$/, "");

  return {
    outputPath: `${base}.normalized.csv`,
    unresolvedOutputPath: `${base}.unresolved.csv`,
    reportOutputPath: `${base}.normalize-report.json`,
  };
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = { ...DEFAULT_OPTIONS };
  let outputOverridden = false;
  let unresolvedOverridden = false;
  let reportOverridden = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") continue;
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--input") {
      const value = args[index + 1];
      if (!value) throw new Error("--input requires a value");
      options.inputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }

    if (arg === "--output") {
      const value = args[index + 1];
      if (!value) throw new Error("--output requires a value");
      options.outputPath = value;
      outputOverridden = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
      outputOverridden = true;
      continue;
    }

    if (arg === "--unresolved-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--unresolved-output requires a value");
      options.unresolvedOutputPath = value;
      unresolvedOverridden = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--unresolved-output=")) {
      options.unresolvedOutputPath = arg.replace("--unresolved-output=", "");
      unresolvedOverridden = true;
      continue;
    }

    if (arg === "--report-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--report-output requires a value");
      options.reportOutputPath = value;
      reportOverridden = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--report-output=")) {
      options.reportOutputPath = arg.replace("--report-output=", "");
      reportOverridden = true;
      continue;
    }

    if (arg === "--model") {
      const value = args[index + 1];
      if (!value) throw new Error("--model requires a value");
      options.model = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--model=")) {
      options.model = arg.replace("--model=", "");
      continue;
    }

    if (arg === "--ph-locations-file") {
      const value = args[index + 1];
      if (!value) throw new Error("--ph-locations-file requires a value");
      options.phLocationsPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--ph-locations-file=")) {
      options.phLocationsPath = arg.replace("--ph-locations-file=", "");
      continue;
    }

    if (arg === "--sport-slug") {
      const value = args[index + 1];
      if (!value) throw new Error("--sport-slug requires a value");
      options.sportSlug = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--sport-slug=")) {
      options.sportSlug = arg.replace("--sport-slug=", "");
      continue;
    }

    if (arg === "--batch-size") {
      options.batchSize = parseNumber(
        args[index + 1],
        "--batch-size",
        options.batchSize,
      );
      index += 1;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseNumber(
        arg.replace("--batch-size=", ""),
        "--batch-size",
        options.batchSize,
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!outputOverridden || !unresolvedOverridden || !reportOverridden) {
    const derived = deriveOutputPaths(options.inputPath);
    if (!outputOverridden) options.outputPath = derived.outputPath;
    if (!unresolvedOverridden) {
      options.unresolvedOutputPath = derived.unresolvedOutputPath;
    }
    if (!reportOverridden) options.reportOutputPath = derived.reportOutputPath;
  }

  return options;
}

function normalizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeStatusToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bq[\s.]*c\b/g, "quezon city")
    .replace(/\bqc\b/g, "quezon city")
    .replace(/\bncr\b/g, "metro manila")
    .replace(/\bmm\b/g, "metro manila")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCityToken(value: string): string {
  return normalizeStatusToken(value)
    .replace(/^island garden city of\s+/, "")
    .replace(/^science city of\s+/, "")
    .replace(/^city of\s+/, "")
    .replace(/^municipality of\s+/, "")
    .replace(/\s+city$/, "")
    .trim();
}

function ensureUnique(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    output.push(item);
  }
  return output;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sanitizeUrlValue(value: unknown): string {
  const text = normalizeString(value);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return parsed.href;
  } catch {
    return "";
  }
}

function canonicalizeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    const pathname = parsed.pathname.replace(/\/+$/, "");
    parsed.pathname = pathname || "/";
    return parsed.toString();
  } catch {
    return value.trim();
  }
}

function parseOptionalNumberAsString(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  const asString = normalizeString(value);
  if (!asString) return "";
  const parsed = Number(asString);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed);
}

function buildRowKey(name: string, city: string, province: string): string {
  return `${normalizeStatusToken(name)}|${normalizeStatusToken(
    city,
  )}|${normalizeStatusToken(province)}`;
}

function escapeCsvCell(value: string): string {
  if (value.includes('"')) {
    value = value.replaceAll('"', '""');
  }
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value}"`;
  }
  return value;
}

function buildCsv(rows: CuratedCsvRow[]): string {
  const header = CSV_HEADERS.join(",");
  const body = rows
    .map((row) =>
      CSV_HEADERS.map((field) => escapeCsvCell(row[field] ?? "")).join(","),
    )
    .join("\n");
  return body.length > 0 ? `${header}\n${body}\n` : `${header}\n`;
}

function buildUnresolvedCsv(rows: UnresolvedRecord[]): string {
  const header = UNRESOLVED_HEADERS.join(",");
  const body = rows
    .map((row) =>
      UNRESOLVED_HEADERS.map((field) => {
        if (field === "source_url") return escapeCsvCell(row.sourceUrl);
        if (field === "name") return escapeCsvCell(row.name);
        if (field === "address") return escapeCsvCell(row.address);
        if (field === "city") return escapeCsvCell(row.city);
        if (field === "province") return escapeCsvCell(row.province);
        if (field === "reason") return escapeCsvCell(row.reason);
        return escapeCsvCell(row.confidence);
      }).join(","),
    )
    .join("\n");

  return body.length > 0 ? `${header}\n${body}\n` : `${header}\n`;
}

function parseDelimitedList(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeCourts(items: string[], sportSlug: string): string[] {
  if (items.length === 0) return [`${sportSlug}|`];

  const normalized = items.map((item) => {
    if (item.includes("|")) return item;
    return `${item}|${sportSlug}|`;
  });

  return ensureUnique(normalized);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toObject(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function loadPhLocationCatalog(
  filePath: string,
): Promise<PHLocationProvince[]> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const raw = await readFile(resolvedPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid PH location catalog at ${resolvedPath}`);
  }

  const provinces = parsed
    .map((entry) => toObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const cities = Array.isArray(entry.cities)
        ? entry.cities
            .map((city) => toObject(city))
            .filter((city): city is Record<string, unknown> => Boolean(city))
            .map((city) => ({
              name: normalizeString(city.name),
              displayName: normalizeString(city.displayName),
              slug: normalizeString(city.slug),
            }))
            .filter((city) => city.name && city.displayName && city.slug)
        : [];

      return {
        name: normalizeString(entry.name),
        displayName: normalizeString(entry.displayName),
        slug: normalizeString(entry.slug),
        cities,
      } satisfies PHLocationProvince;
    })
    .filter(
      (province) =>
        province.name &&
        province.displayName &&
        province.slug &&
        province.cities.length > 0,
    );

  if (provinces.length === 0) {
    throw new Error(`No PH location entries found at ${resolvedPath}`);
  }

  return provinces;
}

function findProvinceByName(
  provinces: PHLocationProvince[],
  value: string,
): PHLocationProvince | null {
  const target = normalizeStatusToken(value);
  if (!target) return null;

  for (const province of provinces) {
    const candidates = [
      province.name,
      province.displayName,
      province.slug,
      province.displayName.replace(/^Province of\s+/i, ""),
    ];
    if (
      candidates.some((candidate) => normalizeStatusToken(candidate) === target)
    ) {
      return province;
    }
  }

  return null;
}

function findCityInProvinceByName(
  province: PHLocationProvince,
  value: string,
): PHLocationCity | null {
  const target = normalizeCityToken(value);
  if (!target) return null;

  for (const city of province.cities) {
    const candidates = [city.name, city.displayName, city.slug];
    if (
      candidates.some((candidate) => normalizeCityToken(candidate) === target)
    )
      return city;
  }

  return null;
}

function findCityAcrossProvincesByName(
  provinces: PHLocationProvince[],
  value: string,
): { province: PHLocationProvince; city: PHLocationCity } | null {
  const target = normalizeCityToken(value);
  if (!target) return null;

  const matches: Array<{ province: PHLocationProvince; city: PHLocationCity }> =
    [];

  for (const province of provinces) {
    for (const city of province.cities) {
      const candidates = [city.name, city.displayName, city.slug];
      if (
        candidates.some((candidate) => normalizeCityToken(candidate) === target)
      ) {
        matches.push({ province, city });
      }
    }
  }

  if (matches.length === 1) {
    return matches[0] ?? null;
  }
  return null;
}

function resolveCanonicalLocation(args: {
  provinces: PHLocationProvince[];
  provinceValue: string;
  cityValue: string;
  fallbackCandidates: string[];
}): { province: PHLocationProvince; city: PHLocationCity } | null {
  const { provinces, provinceValue, cityValue, fallbackCandidates } = args;

  const directProvince = findProvinceByName(provinces, provinceValue);
  if (directProvince) {
    const directCity = findCityInProvinceByName(directProvince, cityValue);
    if (directCity) {
      return { province: directProvince, city: directCity };
    }
  }

  const acrossCity = findCityAcrossProvincesByName(provinces, cityValue);
  if (acrossCity) return acrossCity;

  for (const candidate of fallbackCandidates) {
    const province = findProvinceByName(provinces, candidate);
    if (!province) continue;

    for (const cityCandidate of fallbackCandidates) {
      const city = findCityInProvinceByName(province, cityCandidate);
      if (city) {
        return { province, city };
      }
    }
  }

  for (const cityCandidate of fallbackCandidates) {
    const city = findCityAcrossProvincesByName(provinces, cityCandidate);
    if (city) return city;
  }

  return null;
}

function buildLocationCatalogPrompt(provinces: PHLocationProvince[]) {
  return provinces.map((province) => ({
    provinceName: province.name,
    provinceDisplayName: province.displayName,
    provinceSlug: province.slug,
    cities: province.cities.map((city) => ({
      cityName: city.name,
      cityDisplayName: city.displayName,
      citySlug: city.slug,
    })),
  }));
}

function buildNormalizationPrompt(args: {
  sportSlug: string;
  rows: Array<{ index: number; sourceUrl: string; row: CuratedCsvRow }>;
  catalog: ReturnType<typeof buildLocationCatalogPrompt>;
}): string {
  return [
    "Normalize scraped Philippine sports venue rows into curated-courts format.",
    "",
    "Rules:",
    "1) Output one result per input index.",
    '2) Set status to "unresolved" when province/city cannot be confidently mapped to canonical PH location values.',
    "3) If status is unresolved, include reason and confidence.",
    "4) When status is accepted, return a normalized object with clean values.",
    "5) Use PH country and Asia/Manila time zone unless source strongly indicates otherwise.",
    `6) Ensure courts includes ${args.sportSlug} if no specific sport is found.`,
    "",
    "Location catalog JSON:",
    JSON.stringify(args.catalog),
    "",
    "Rows JSON:",
    JSON.stringify(args.rows),
  ].join("\n");
}

function buildSourceDedupKey(sourceUrl: string, row: CuratedCsvRow): string {
  const normalizedUrl = sanitizeUrlValue(sourceUrl);
  if (normalizedUrl) {
    return `url:${canonicalizeUrl(normalizedUrl)}`;
  }
  return `row:${buildRowKey(row.name, row.city, row.province)}`;
}

async function normalizeBatch(args: {
  rows: Array<{ index: number; sourceUrl: string; row: CuratedCsvRow }>;
  model: string;
  sportSlug: string;
  catalogPrompt: ReturnType<typeof buildLocationCatalogPrompt>;
}) {
  const response = await generateObject({
    model: openai(args.model),
    schema: AI_NORMALIZATION_BATCH_SCHEMA,
    system:
      "You are a strict data-normalization engine for Philippine venue migration.",
    prompt: buildNormalizationPrompt({
      sportSlug: args.sportSlug,
      rows: args.rows,
      catalog: args.catalogPrompt,
    }),
  });

  return response.object.rows;
}

function toProvisionalRowWithSource(value: unknown): RowWithSource | null {
  const entry = toObject(value);
  if (!entry) return null;
  const rowObject = toObject(entry.row);
  if (!rowObject) return null;

  const row: CuratedCsvRow = {
    name: normalizeString(rowObject.name),
    address: normalizeString(rowObject.address),
    city: normalizeString(rowObject.city),
    province: normalizeString(rowObject.province),
    country: normalizeString(rowObject.country) || "PH",
    time_zone: normalizeString(rowObject.time_zone) || "Asia/Manila",
    latitude: normalizeString(rowObject.latitude),
    longitude: normalizeString(rowObject.longitude),
    facebook_url: normalizeString(rowObject.facebook_url),
    instagram_url: normalizeString(rowObject.instagram_url),
    viber_contact: normalizeString(rowObject.viber_contact),
    website_url: normalizeString(rowObject.website_url),
    other_contact_info: normalizeString(rowObject.other_contact_info),
    amenities: normalizeString(rowObject.amenities),
    courts: normalizeString(rowObject.courts),
    photo_urls: normalizeString(rowObject.photo_urls),
  };

  if (!row.name || !row.address) return null;

  return {
    sourceUrl: normalizeString(entry.sourceUrl),
    row,
  };
}

async function main() {
  const options = parseArgs();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const resolvedInputPath = path.resolve(process.cwd(), options.inputPath);
  const resolvedOutputPath = path.resolve(process.cwd(), options.outputPath);
  const resolvedUnresolvedPath = path.resolve(
    process.cwd(),
    options.unresolvedOutputPath,
  );
  const resolvedReportPath = path.resolve(
    process.cwd(),
    options.reportOutputPath,
  );

  const rawText = await readFile(resolvedInputPath, "utf-8");
  const parsed = JSON.parse(rawText) as CrawlRawOutput;
  const rawRecords = Array.isArray(parsed.rawRecords)
    ? parsed.rawRecords
        .map((record) => toProvisionalRowWithSource(record))
        .filter((record): record is RowWithSource => Boolean(record))
    : [];

  if (rawRecords.length === 0) {
    throw new Error(
      `No rawRecords found in ${resolvedInputPath}. Run crawl stage with --crawl-only first.`,
    );
  }

  const sportSlug = normalizeString(parsed.sportSlug) || options.sportSlug;
  const provinces = await loadPhLocationCatalog(options.phLocationsPath);
  const catalogPrompt = buildLocationCatalogPrompt(provinces);

  const acceptedRows: CuratedCsvRow[] = [];
  const unresolvedRows: UnresolvedRecord[] = [];
  const duplicateRows: Array<{
    dedupKey: string;
    name: string;
    sourceUrl: string;
  }> = [];
  const unresolvedIndexes = new Set<number>();
  const seenDedupKeys = new Set<string>();

  const rowsWithIndex = rawRecords.map((entry, index) => ({
    index,
    sourceUrl: entry.sourceUrl,
    row: entry.row,
  }));

  const aiSuggestions = new Map<
    number,
    z.infer<typeof AI_NORMALIZED_ROW_SCHEMA>
  >();
  const batches = chunkArray(rowsWithIndex, options.batchSize);
  for (const [batchIndex, batchRows] of batches.entries()) {
    try {
      const suggestions = await normalizeBatch({
        rows: batchRows,
        model: options.model,
        sportSlug,
        catalogPrompt,
      });

      for (const suggestion of suggestions) {
        aiSuggestions.set(suggestion.index, suggestion);
      }
      console.log(
        `Normalized batch ${batchIndex + 1}/${batches.length} (${batchRows.length} rows)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI error";
      console.warn(
        `AI normalization failed for batch ${batchIndex + 1}/${batches.length}: ${message}`,
      );
      for (const row of batchRows) {
        unresolvedIndexes.add(row.index);
        unresolvedRows.push({
          sourceUrl: row.sourceUrl,
          name: row.row.name,
          address: row.row.address,
          city: row.row.city,
          province: row.row.province,
          reason: `AI batch failure: ${message}`,
          confidence: "low",
        });
      }
    }
  }

  for (const rowEntry of rowsWithIndex) {
    if (unresolvedIndexes.has(rowEntry.index)) {
      continue;
    }

    const suggestion = aiSuggestions.get(rowEntry.index);
    if (!suggestion) {
      unresolvedIndexes.add(rowEntry.index);
      unresolvedRows.push({
        sourceUrl: rowEntry.sourceUrl,
        name: rowEntry.row.name,
        address: rowEntry.row.address,
        city: rowEntry.row.city,
        province: rowEntry.row.province,
        reason: "AI returned no output for row index",
        confidence: "low",
      });
      continue;
    }

    if (suggestion.status !== "accepted" || !suggestion.normalized) {
      unresolvedIndexes.add(rowEntry.index);
      unresolvedRows.push({
        sourceUrl: rowEntry.sourceUrl,
        name: rowEntry.row.name,
        address: rowEntry.row.address,
        city: rowEntry.row.city,
        province: rowEntry.row.province,
        reason: normalizeString(suggestion.reason) || "Marked unresolved by AI",
        confidence: normalizeString(suggestion.confidence) || "low",
      });
      continue;
    }

    const normalized = suggestion.normalized;
    const mergedName = normalizeString(normalized.name) || rowEntry.row.name;
    const mergedAddress =
      normalizeString(normalized.address) || rowEntry.row.address;
    const mergedCity =
      normalizeString(normalized.cityName) || rowEntry.row.city;
    const mergedProvince =
      normalizeString(normalized.provinceName) || rowEntry.row.province;

    const canonicalLocation = resolveCanonicalLocation({
      provinces,
      provinceValue: mergedProvince,
      cityValue: mergedCity,
      fallbackCandidates: [
        mergedCity,
        mergedProvince,
        mergedName,
        mergedAddress,
        rowEntry.row.city,
        rowEntry.row.province,
        rowEntry.sourceUrl,
      ],
    });

    if (!canonicalLocation) {
      unresolvedIndexes.add(rowEntry.index);
      unresolvedRows.push({
        sourceUrl: rowEntry.sourceUrl,
        name: mergedName,
        address: mergedAddress,
        city: mergedCity,
        province: mergedProvince,
        reason:
          normalizeString(suggestion.reason) ||
          "Could not match canonical PH province/city",
        confidence: normalizeString(suggestion.confidence) || "low",
      });
      continue;
    }

    const amenities = ensureUnique(
      (normalized.amenities ?? parseDelimitedList(rowEntry.row.amenities))
        .map((item) => normalizeString(item))
        .filter((item) => item.length > 0),
    );
    const courts = normalizeCourts(
      ensureUnique(
        (normalized.courts ?? parseDelimitedList(rowEntry.row.courts))
          .map((item) => normalizeString(item))
          .filter((item) => item.length > 0),
      ),
      sportSlug,
    );
    const photoUrls = ensureUnique(
      (normalized.photoUrls ?? parseDelimitedList(rowEntry.row.photo_urls))
        .map((item) => sanitizeUrlValue(item))
        .filter((item) => item.length > 0),
    );

    const nextRow: CuratedCsvRow = {
      name: mergedName,
      address: mergedAddress,
      city: canonicalLocation.city.name,
      province: canonicalLocation.province.name,
      country:
        normalizeString(normalized.country).toUpperCase() === "PH"
          ? "PH"
          : "PH",
      time_zone: normalizeString(normalized.timeZone) || "Asia/Manila",
      latitude:
        parseOptionalNumberAsString(normalized.latitude) ||
        rowEntry.row.latitude,
      longitude:
        parseOptionalNumberAsString(normalized.longitude) ||
        rowEntry.row.longitude,
      facebook_url:
        sanitizeUrlValue(normalized.facebookUrl) || rowEntry.row.facebook_url,
      instagram_url:
        sanitizeUrlValue(normalized.instagramUrl) || rowEntry.row.instagram_url,
      viber_contact:
        normalizeString(normalized.viberContact) || rowEntry.row.viber_contact,
      website_url:
        sanitizeUrlValue(normalized.websiteUrl) || rowEntry.row.website_url,
      other_contact_info:
        normalizeString(normalized.otherContactInfo) ||
        rowEntry.row.other_contact_info,
      amenities: amenities.join(";"),
      courts: courts.join(";"),
      photo_urls: photoUrls.join(","),
    };

    const dedupKey = buildSourceDedupKey(rowEntry.sourceUrl, nextRow);
    if (seenDedupKeys.has(dedupKey)) {
      duplicateRows.push({
        dedupKey,
        name: nextRow.name,
        sourceUrl: rowEntry.sourceUrl,
      });
      continue;
    }

    seenDedupKeys.add(dedupKey);
    acceptedRows.push(nextRow);
  }

  const csv = buildCsv(acceptedRows);
  const unresolvedCsv = buildUnresolvedCsv(unresolvedRows);
  const report = {
    generatedAt: new Date().toISOString(),
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    unresolvedOutputPath: options.unresolvedOutputPath,
    reportOutputPath: options.reportOutputPath,
    model: options.model,
    sportSlug,
    batchSize: options.batchSize,
    totalRawRecords: rawRecords.length,
    acceptedRows: acceptedRows.length,
    unresolvedRows: unresolvedRows.length,
    duplicateRows: duplicateRows.length,
    unresolved: unresolvedRows,
    duplicates: duplicateRows,
  };

  if (options.dryRun) {
    console.log(`Dry run complete. Accepted rows: ${acceptedRows.length}`);
    console.log(`Dry run complete. Unresolved rows: ${unresolvedRows.length}`);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await ensureParentDir(resolvedOutputPath);
  await ensureParentDir(resolvedUnresolvedPath);
  await ensureParentDir(resolvedReportPath);

  await Promise.all([
    writeFile(resolvedOutputPath, csv, "utf-8"),
    writeFile(resolvedUnresolvedPath, unresolvedCsv, "utf-8"),
    writeFile(resolvedReportPath, JSON.stringify(report, null, 2), "utf-8"),
  ]);

  console.log(`Wrote normalized CSV to ${resolvedOutputPath}`);
  console.log(`Wrote unresolved CSV to ${resolvedUnresolvedPath}`);
  console.log(`Wrote normalization report to ${resolvedReportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
