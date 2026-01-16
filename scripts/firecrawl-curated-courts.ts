/**
 * Firecrawl scraper for curated pickleball court listings.
 *
 * Usage:
 *   pnpm scrape:curated-courts -- --input scripts/templates/curated-courts-urls.txt
 *   pnpm scrape:curated-courts -- --query "pickleball courts" --location "Cebu, Philippines" --country PH
 *   pnpm scrape:curated-courts -- --output scripts/output/curated-courts.csv
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pRetry, { AbortError } from "p-retry";

interface ScrapeOptions {
  inputPath: string;
  outputPath: string;
  jsonPath: string;
  query?: string;
  searchLimit: number;
  searchCountry: string;
  searchLocation?: string;
}

interface BatchScrapeResponse {
  status?: string;
  success?: boolean;
  id?: string;
  url?: string;
  invalidURLs?: string[] | null;
  total?: number;
  completed?: number;
  creditsUsed?: number;
  expiresAt?: string;
  next?: string | null;
  data?: Array<{ json?: Record<string, unknown> }>;
}

interface SearchResponse {
  success?: boolean;
  data?: {
    web?: Array<{ url?: string | null }>;
  };
  warning?: string | null;
}

interface NormalizedCourtRow {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  timeZone: string;
  latitude: string;
  longitude: string;
  facebookUrl: string;
  instagramUrl: string;
  viberContact: string;
  websiteUrl: string;
  otherContactInfo: string;
  amenities: string[];
  courts: string[];
  photoUrls: string[];
  sourceUrl: string;
}

const DEFAULT_INPUT = "scripts/templates/curated-courts-urls.txt";
const DEFAULT_OUTPUT = "scripts/output/curated-courts.csv";
const DEFAULT_JSON = "scripts/output/curated-courts.json";
const DEFAULT_SEARCH_LIMIT = 25;
const DEFAULT_SEARCH_COUNTRY = "PH";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 10 * 60 * 1000;
const MAX_POLL_RETRIES = Math.max(
  1,
  Math.ceil(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS) - 1,
);

const CSV_HEADER = [
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

const PROMPT = `You are extracting pickleball court listings for a curated venue database.

Return a JSON object with:
- name, address, city, province, country, time_zone
- latitude, longitude (string or null)
- website_url, facebook_url, instagram_url, viber_contact, other_contact_info
- amenities as a list of short labels
- courts as an array of court unit strings using:
  - sport_slug
  - sport_slug|tier_label
  - label|sport_slug|tier_label
  If sport is not specified, use sport_slug "pickleball".
- photo_urls as a list of image URLs
- source_url (the page URL)

If data is missing, return null. Do not hallucinate.`;

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    province: { type: "string" },
    country: { type: "string" },
    time_zone: { type: "string" },
    latitude: { type: "string" },
    longitude: { type: "string" },
    facebook_url: { type: "string" },
    instagram_url: { type: "string" },
    viber_contact: { type: "string" },
    website_url: { type: "string" },
    other_contact_info: { type: "string" },
    amenities: { type: "array", items: { type: "string" } },
    courts: { type: "array", items: { type: "string" } },
    photo_urls: { type: "array", items: { type: "string" } },
    source_url: { type: "string" },
  },
  required: ["name", "address", "city"],
};

function parseSearchLimit(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("--limit must be an integer between 1 and 100");
  }
  return parsed;
}

function parseArgs(): ScrapeOptions {
  const args = process.argv.slice(2);
  const options: ScrapeOptions = {
    inputPath: DEFAULT_INPUT,
    outputPath: DEFAULT_OUTPUT,
    jsonPath: DEFAULT_JSON,
    query: undefined,
    searchLimit: DEFAULT_SEARCH_LIMIT,
    searchCountry: DEFAULT_SEARCH_COUNTRY,
    searchLocation: undefined,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--input") {
      const value = args[i + 1];
      if (!value) throw new Error("--input requires a path value");
      options.inputPath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--input=")) {
      options.inputPath = arg.replace("--input=", "");
      continue;
    }
    if (arg === "--output") {
      const value = args[i + 1];
      if (!value) throw new Error("--output requires a path value");
      options.outputPath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
      continue;
    }
    if (arg === "--json") {
      const value = args[i + 1];
      if (!value) throw new Error("--json requires a path value");
      options.jsonPath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--json=")) {
      options.jsonPath = arg.replace("--json=", "");
      continue;
    }
    if (arg === "--query") {
      const value = args[i + 1];
      if (!value) throw new Error("--query requires a value");
      options.query = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--query=")) {
      const value = arg.replace("--query=", "");
      if (!value) throw new Error("--query requires a value");
      options.query = value;
      continue;
    }
    if (arg === "--limit") {
      const value = args[i + 1];
      if (!value) throw new Error("--limit requires a number");
      options.searchLimit = parseSearchLimit(value);
      i += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      const value = arg.replace("--limit=", "");
      if (!value) throw new Error("--limit requires a number");
      options.searchLimit = parseSearchLimit(value);
      continue;
    }
    if (arg === "--country") {
      const value = args[i + 1];
      if (!value) throw new Error("--country requires a value");
      options.searchCountry = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--country=")) {
      const value = arg.replace("--country=", "");
      if (!value) throw new Error("--country requires a value");
      options.searchCountry = value;
      continue;
    }
    if (arg === "--location") {
      const value = args[i + 1];
      if (!value) throw new Error("--location requires a value");
      options.searchLocation = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--location=")) {
      const value = arg.replace("--location=", "");
      if (!value) throw new Error("--location requires a value");
      options.searchLocation = value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseUrls(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function mergeUrls(...lists: string[][]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    for (const url of list) {
      const value = url.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      merged.push(value);
    }
  }

  return merged;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

async function readInputUrls(inputPath: string): Promise<string[]> {
  try {
    const inputContent = await readFile(inputPath, "utf-8");
    return parseUrls(inputContent);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function normalizeList(value: unknown, delimiter?: string): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    if (!value.trim()) return [];
    if (delimiter) {
      return value
        .split(delimiter)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [value.trim()];
  }
  return [];
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value);
}

function buildCourts(value: unknown): string[] {
  const rawCourts = normalizeList(value, ";");
  if (rawCourts.length > 0) return rawCourts;
  return ["pickleball|"];
}

function normalizeRow(data: Record<string, unknown>): NormalizedCourtRow {
  const amenities = normalizeList(data.amenities, ";");
  const courts = buildCourts(data.courts);
  const photoUrls = normalizeList(data.photo_urls, ",");

  return {
    name: toStringValue(data.name),
    address: toStringValue(data.address),
    city: toStringValue(data.city),
    province: toStringValue(data.province),
    country: toStringValue(data.country) || "PH",
    timeZone: toStringValue(data.time_zone) || "Asia/Manila",
    latitude: toStringValue(data.latitude),
    longitude: toStringValue(data.longitude),
    facebookUrl: toStringValue(data.facebook_url),
    instagramUrl: toStringValue(data.instagram_url),
    viberContact: toStringValue(data.viber_contact),
    websiteUrl: toStringValue(data.website_url),
    otherContactInfo: toStringValue(data.other_contact_info),
    amenities,
    courts,
    photoUrls,
    sourceUrl: toStringValue(data.source_url),
  };
}

function isPhilippinesCountry(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "ph" || normalized === "philippines";
}

function escapeCsv(value: string): string {
  if (!value) return "";
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsvRow(row: NormalizedCourtRow): string {
  const values = [
    row.name,
    row.address,
    row.city,
    row.province,
    row.country,
    row.timeZone,
    row.latitude,
    row.longitude,
    row.facebookUrl,
    row.instagramUrl,
    row.viberContact,
    row.websiteUrl,
    row.otherContactInfo,
    row.amenities.join(";"),
    row.courts.join(";"),
    row.photoUrls.join(","),
  ];

  return values.map(escapeCsv).join(",");
}

async function searchUrls(
  query: string,
  apiKey: string,
  options: { limit: number; country: string; location?: string },
): Promise<string[]> {
  const response = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: options.limit,
      sources: ["web"],
      country: options.country,
      location: options.location,
      ignoreInvalidURLs: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl search failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as SearchResponse;

  if (payload.success === false) {
    throw new Error("Firecrawl search failed to return results");
  }

  return (payload.data?.web ?? [])
    .map((item) => item.url ?? "")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

async function fetchJson(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`Firecrawl request failed (${response.status})`);
  }
  return (await response.json()) as BatchScrapeResponse;
}

async function collectBatchResults(
  initial: BatchScrapeResponse,
  apiKey: string,
) {
  const results = [...(initial.data ?? [])];
  let next = initial.next;

  while (next) {
    const page = await fetchJson(next, apiKey);
    results.push(...(page.data ?? []));
    next = page.next ?? null;
  }

  return results;
}

async function pollBatchResults(statusUrl: string, apiKey: string) {
  const start = Date.now();

  return pRetry(
    async () => {
      const status = await fetchJson(statusUrl, apiKey);

      if (!status.status) {
        throw new Error("Batch scrape status is missing in response");
      }

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new AbortError("Batch scrape failed");
      }

      const elapsed = Date.now() - start;
      if (elapsed >= MAX_POLL_DURATION_MS) {
        throw new AbortError("Batch scrape timed out after 10 minutes");
      }

      throw new Error(`Batch scrape still ${status.status}`);
    },
    {
      retries: MAX_POLL_RETRIES,
      factor: 1,
      minTimeout: POLL_INTERVAL_MS,
      maxTimeout: POLL_INTERVAL_MS,
      randomize: false,
      onFailedAttempt: ({ attemptNumber, retriesLeft, error }) => {
        if (
          attemptNumber === 1 ||
          attemptNumber % 10 === 0 ||
          retriesLeft === 0
        ) {
          console.log(
            `Batch scrape pending (attempt ${attemptNumber}). ${retriesLeft} retries left. ${error.message}`,
          );
        }
      },
    },
  );
}

async function scrapeUrls(urls: string[], apiKey: string) {
  const response = await fetch("https://api.firecrawl.dev/v2/batch/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      urls,
      formats: [
        {
          type: "json",
          prompt: PROMPT,
          schema: SCHEMA,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Firecrawl batch scrape failed (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as BatchScrapeResponse;

  if (data.invalidURLs && data.invalidURLs.length > 0) {
    console.log("Skipped invalid URLs:", data.invalidURLs);
  }

  if (data.id) {
    const statusUrl =
      data.url ?? `https://api.firecrawl.dev/v2/batch/scrape/${data.id}`;
    const status = await pollBatchResults(statusUrl, apiKey);
    return collectBatchResults(status, apiKey);
  }

  if (data.status && data.status !== "completed") {
    throw new Error(`Unexpected batch scrape status: ${data.status}`);
  }

  return collectBatchResults(data, apiKey);
}

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function run() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  const {
    inputPath,
    outputPath,
    jsonPath,
    query,
    searchLimit,
    searchCountry,
    searchLocation,
  } = parseArgs();
  const inputUrls = await readInputUrls(inputPath);
  let urls = mergeUrls(inputUrls);

  if (query) {
    console.log(`Searching the web for "${query}"...`);
    const searchResults = await searchUrls(query, apiKey, {
      limit: searchLimit,
      country: searchCountry,
      location: searchLocation,
    });
    if (searchResults.length === 0) {
      console.log("Search returned no URLs.");
    }
    urls = mergeUrls(urls, searchResults);
  }

  if (urls.length === 0) {
    throw new Error(
      "No URLs found. Provide --input with URLs or use --query to search the web.",
    );
  }

  console.log(`Scraping ${urls.length} URLs via Firecrawl...`);
  const results = await scrapeUrls(urls, apiKey);

  const normalizedRows = results
    .map((item) => item.json ?? {})
    .map((item) => normalizeRow(item));

  const filteredRows = normalizedRows.filter((row) =>
    isPhilippinesCountry(row.country),
  );

  const removedCount = normalizedRows.length - filteredRows.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} non-Philippines rows.`);
  }

  const csvRows = [CSV_HEADER.join(",")].concat(
    filteredRows.map((row) => buildCsvRow(row)),
  );

  await ensureDir(outputPath);
  await ensureDir(jsonPath);

  await writeFile(outputPath, csvRows.join("\n"));
  await writeFile(
    jsonPath,
    JSON.stringify(
      filteredRows.map((row, index) => ({
        index,
        data: row,
      })),
      null,
      2,
    ),
  );

  console.log(`CSV written to ${outputPath}`);
  console.log(`JSON written to ${jsonPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
