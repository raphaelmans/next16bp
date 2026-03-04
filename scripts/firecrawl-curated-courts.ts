/**
 * Build curated courts CSV from Firecrawl extraction.
 *
 * Default flow:
 *  1) map URLs from a start URL
 *  2) extract structured venue data from candidate URLs
 *  3) write CSV compatible with scripts/import-curated-courts.ts
 *
 * Usage:
 *   pnpm scrape:curated-courts
 *   pnpm scrape:curated-courts -- --start-url https://app.sports360.ph/
 *   pnpm scrape:curated-courts -- --max-urls 80 --map-limit 300
 *   pnpm scrape:curated-courts -- --urls-file scripts/output/sports360-urls.txt
 *   pnpm scrape:curated-courts -- --dry-run
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

interface ScriptOptions {
  startUrl: string;
  outputPath: string;
  rawOutputPath: string;
  statePath: string;
  coverageOutputPath: string;
  sportSlug: string;
  mapLimit: number;
  maxUrls: number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  dryRun: boolean;
  discoverOnly: boolean;
  rescrapeAll: boolean;
  skipDbCoverage: boolean;
  mapSearch: string | null;
  includePatterns: string[];
  excludePatterns: string[];
  urlsFilePath: string | null;
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

interface Sports360Storehub {
  sportsHubName?: unknown;
  address?: unknown;
  hubContactNo?: unknown;
  hubEmailAdd?: unknown;
  fullLoc?: unknown;
}

interface RowWithSource {
  row: CuratedCsvRow;
  sourceUrl: string;
}

type UrlStatus = "discovered" | "scraped" | "no_data" | "failed";

interface UrlStateEntry {
  canonicalUrl: string;
  latestUrl: string;
  firstDiscoveredAt: string;
  lastDiscoveredAt: string;
  attempts: number;
  lastAttemptedAt: string | null;
  lastStatus: UrlStatus;
  lastError: string | null;
  lastRowKey: string | null;
  lastRowName: string | null;
}

interface RowStateEntry {
  rowKey: string;
  name: string;
  city: string;
  province: string;
  sourceUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface ScrapeState {
  version: number;
  startUrl: string;
  createdAt: string;
  updatedAt: string;
  urls: Record<string, UrlStateEntry>;
  rows: Record<string, RowStateEntry>;
}

interface ExistingCuratedPlace {
  id: string;
  name: string;
  city: string;
  province: string;
}

type JsonObject = Record<string, unknown>;

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";

const DEFAULT_OPTIONS: ScriptOptions = {
  startUrl: "https://app.sports360.ph/",
  outputPath: "scripts/output/sports360-curated-courts.csv",
  rawOutputPath: "scripts/output/sports360-curated-courts.raw.json",
  statePath: "scripts/output/sports360-scrape-state.json",
  coverageOutputPath: "scripts/output/sports360-coverage.json",
  sportSlug: "pickleball",
  mapLimit: 250,
  maxUrls: 80,
  pollIntervalMs: 2_000,
  pollTimeoutMs: 120_000,
  dryRun: false,
  discoverOnly: false,
  rescrapeAll: false,
  skipDbCoverage: false,
  mapSearch: "sports venue court branch location",
  includePatterns: [
    "/venue",
    "/venues",
    "/court",
    "/courts",
    "/facility",
    "/facilities",
    "/club",
    "/location",
    "/branch",
    "/sportshub",
  ],
  excludePatterns: [
    "/login",
    "/signup",
    "/register",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/help",
    "/blog",
    "/news",
    "/admin",
    "/dashboard",
  ],
  urlsFilePath: null,
};

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

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
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
  required: ["name", "address", "city", "province"],
} as const;

const EXTRACT_STATUS_DONE = new Set([
  "completed",
  "done",
  "success",
  "succeeded",
]);
const EXTRACT_STATUS_FAILED = new Set([
  "failed",
  "error",
  "errored",
  "cancelled",
  "canceled",
]);

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

function parseListArg(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--") {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--discover-only") {
      options.discoverOnly = true;
      continue;
    }

    if (arg === "--rescrape-all") {
      options.rescrapeAll = true;
      continue;
    }

    if (arg === "--skip-db-coverage") {
      options.skipDbCoverage = true;
      continue;
    }

    if (arg === "--start-url") {
      const value = args[i + 1];
      if (!value) throw new Error("--start-url requires a value");
      options.startUrl = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--start-url=")) {
      options.startUrl = arg.replace("--start-url=", "");
      continue;
    }

    if (arg === "--output") {
      const value = args[i + 1];
      if (!value) throw new Error("--output requires a value");
      options.outputPath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
      continue;
    }

    if (arg === "--raw-output") {
      const value = args[i + 1];
      if (!value) throw new Error("--raw-output requires a value");
      options.rawOutputPath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--raw-output=")) {
      options.rawOutputPath = arg.replace("--raw-output=", "");
      continue;
    }

    if (arg === "--state") {
      const value = args[i + 1];
      if (!value) throw new Error("--state requires a value");
      options.statePath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--state=")) {
      options.statePath = arg.replace("--state=", "");
      continue;
    }

    if (arg === "--coverage-output") {
      const value = args[i + 1];
      if (!value) throw new Error("--coverage-output requires a value");
      options.coverageOutputPath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--coverage-output=")) {
      options.coverageOutputPath = arg.replace("--coverage-output=", "");
      continue;
    }

    if (arg === "--sport-slug") {
      const value = args[i + 1];
      if (!value) throw new Error("--sport-slug requires a value");
      options.sportSlug = value.trim();
      i += 1;
      continue;
    }

    if (arg.startsWith("--sport-slug=")) {
      options.sportSlug = arg.replace("--sport-slug=", "").trim();
      continue;
    }

    if (arg === "--map-limit") {
      options.mapLimit = parseNumber(
        args[i + 1],
        "--map-limit",
        options.mapLimit,
      );
      i += 1;
      continue;
    }

    if (arg.startsWith("--map-limit=")) {
      options.mapLimit = parseNumber(
        arg.replace("--map-limit=", ""),
        "--map-limit",
        options.mapLimit,
      );
      continue;
    }

    if (arg === "--max-urls") {
      options.maxUrls = parseNumber(args[i + 1], "--max-urls", options.maxUrls);
      i += 1;
      continue;
    }

    if (arg.startsWith("--max-urls=")) {
      options.maxUrls = parseNumber(
        arg.replace("--max-urls=", ""),
        "--max-urls",
        options.maxUrls,
      );
      continue;
    }

    if (arg === "--poll-interval-ms") {
      options.pollIntervalMs = parseNumber(
        args[i + 1],
        "--poll-interval-ms",
        options.pollIntervalMs,
      );
      i += 1;
      continue;
    }

    if (arg.startsWith("--poll-interval-ms=")) {
      options.pollIntervalMs = parseNumber(
        arg.replace("--poll-interval-ms=", ""),
        "--poll-interval-ms",
        options.pollIntervalMs,
      );
      continue;
    }

    if (arg === "--poll-timeout-ms") {
      options.pollTimeoutMs = parseNumber(
        args[i + 1],
        "--poll-timeout-ms",
        options.pollTimeoutMs,
      );
      i += 1;
      continue;
    }

    if (arg.startsWith("--poll-timeout-ms=")) {
      options.pollTimeoutMs = parseNumber(
        arg.replace("--poll-timeout-ms=", ""),
        "--poll-timeout-ms",
        options.pollTimeoutMs,
      );
      continue;
    }

    if (arg === "--map-search") {
      const value = args[i + 1];
      if (!value) throw new Error("--map-search requires a value");
      options.mapSearch = value.trim() || null;
      i += 1;
      continue;
    }

    if (arg.startsWith("--map-search=")) {
      const value = arg.replace("--map-search=", "").trim();
      options.mapSearch = value || null;
      continue;
    }

    if (arg === "--include") {
      const value = args[i + 1];
      if (!value) throw new Error("--include requires a comma-separated value");
      options.includePatterns = parseListArg(value);
      i += 1;
      continue;
    }

    if (arg.startsWith("--include=")) {
      options.includePatterns = parseListArg(arg.replace("--include=", ""));
      continue;
    }

    if (arg === "--exclude") {
      const value = args[i + 1];
      if (!value) throw new Error("--exclude requires a comma-separated value");
      options.excludePatterns = parseListArg(value);
      i += 1;
      continue;
    }

    if (arg.startsWith("--exclude=")) {
      options.excludePatterns = parseListArg(arg.replace("--exclude=", ""));
      continue;
    }

    if (arg === "--urls-file") {
      const value = args[i + 1];
      if (!value) throw new Error("--urls-file requires a path value");
      options.urlsFilePath = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--urls-file=")) {
      options.urlsFilePath = arg.replace("--urls-file=", "");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.sportSlug) {
    throw new Error("--sport-slug cannot be empty");
  }

  return options;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function normalizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0);
  }

  return [];
}

function parseOptionalNumberAsString(value: unknown): string {
  const normalized = normalizeString(value);
  if (!normalized) return "";
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return "";
  return parsed.toString();
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ensureUnique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeKeyPart(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildRowKey(name: string, city: string, province: string): string {
  return [
    normalizeKeyPart(name),
    normalizeKeyPart(city),
    normalizeKeyPart(province),
  ].join("|");
}

function canonicalizeUrl(url: string): string {
  if (!isValidHttpUrl(url)) return normalizeString(url);

  const parsed = new URL(url);
  parsed.hash = "";

  const removableParams = [
    "fbclid",
    "gclid",
    "igshid",
    "ref",
    "ref_src",
    "source",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
  ];

  for (const key of removableParams) {
    parsed.searchParams.delete(key);
  }

  const sortedEntries = Array.from(parsed.searchParams.entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  parsed.search = "";
  for (const [key, value] of sortedEntries) {
    parsed.searchParams.append(key, value);
  }

  const isRootPath = parsed.pathname === "/";
  if (!isRootPath && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

function isLikelyAlreadyScraped(entry: UrlStateEntry): boolean {
  return entry.lastStatus === "scraped" || entry.lastStatus === "no_data";
}

function toCsvValue(value: string): string {
  if (!value) return "";
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(rows: CuratedCsvRow[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) => toCsvValue(row[header])).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

async function ensureParentDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function firecrawlRequest<T = JsonObject>(
  apiKey: string,
  endpoint: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${FIRECRAWL_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
    throw new Error(
      `Firecrawl request failed (${response.status}) ${endpoint}: ${message}`,
    );
  }

  return parsed as T;
}

async function mapUrls(
  options: ScriptOptions,
  apiKey: string,
): Promise<string[]> {
  const payload: JsonObject = {
    url: options.startUrl,
    limit: options.mapLimit,
  };

  if (options.mapSearch) {
    payload.search = options.mapSearch;
  }

  const response = await firecrawlRequest(apiKey, "/map", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const object = toObject(response);
  if (!object) {
    throw new Error("Unexpected map response format");
  }

  const data = toObject(object.data);
  const linkCandidates = [
    ...(Array.isArray(object.links) ? object.links : []),
    ...(Array.isArray(data?.links) ? data.links : []),
    ...(Array.isArray(object.data) ? object.data : []),
  ];

  const links = ensureUnique(
    linkCandidates.map((item) => extractUrl(item)).filter(Boolean),
  );

  return links;
}

function extractUrl(value: unknown): string {
  if (typeof value === "string") {
    const normalized = normalizeString(value);
    return isValidHttpUrl(normalized) ? normalized : "";
  }

  const objectValue = toObject(value);
  if (!objectValue) return "";

  const fields = [objectValue.url, objectValue.link, objectValue.href];
  for (const field of fields) {
    const normalized = normalizeString(field);
    if (isValidHttpUrl(normalized)) {
      return normalized;
    }
  }

  return "";
}

async function getSitemapUrls(startUrl: string): Promise<string[]> {
  const origin = new URL(startUrl).origin;
  const sitemapPaths = ["/sitemap.xml", "/sitemap_index.xml"];
  const links: string[] = [];

  for (const sitemapPath of sitemapPaths) {
    const url = `${origin}${sitemapPath}`;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const xml = await response.text();
      const matches = xml.matchAll(/<loc>(.*?)<\/loc>/gi);
      for (const match of matches) {
        const raw = normalizeString(match[1]);
        if (isValidHttpUrl(raw)) {
          links.push(raw);
        }
      }
    } catch {}
  }

  return ensureUnique(links);
}

function isSitemapUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().includes("sitemap");
  } catch {
    return false;
  }
}

async function expandSitemapUrls(urls: string[]): Promise<string[]> {
  const sitemapUrls = urls.filter((url) => isSitemapUrl(url));
  if (sitemapUrls.length === 0) return [];

  const expandedLinks: string[] = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) continue;
      const xml = await response.text();
      const matches = xml.matchAll(/<loc>(.*?)<\/loc>/gi);
      for (const match of matches) {
        const raw = normalizeString(match[1]);
        if (isValidHttpUrl(raw)) {
          expandedLinks.push(raw);
        }
      }
    } catch {}
  }

  return ensureUnique(expandedLinks);
}

async function loadUrlsFromFile(filePath: string): Promise<string[]> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const fileContents = await readFile(resolvedPath, "utf-8");
  const urls = ensureUnique(
    fileContents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .filter((line) => isValidHttpUrl(line)),
  );

  if (urls.length === 0) {
    throw new Error(`No valid URLs found in ${resolvedPath}`);
  }

  return urls;
}

function hasStaticAssetExtension(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(css|js|json|xml|txt|pdf|png|jpe?g|gif|webp|svg|ico|woff2?)$/.test(
      pathname,
    );
  } catch {
    return true;
  }
}

function getRootDomain(host: string): string {
  const parts = host.split(".").filter((part) => part.length > 0);
  if (parts.length < 2) return host;
  return parts.slice(-2).join(".");
}

function selectCandidateUrls(
  urls: string[],
  options: ScriptOptions,
): { urls: string[]; includeFallbackUsed: boolean } {
  const includePatterns = options.includePatterns.map((item) =>
    item.toLowerCase(),
  );
  const excludePatterns = options.excludePatterns.map((item) =>
    item.toLowerCase(),
  );

  const startHost = new URL(options.startUrl).host;
  const startRootDomain = getRootDomain(startHost);

  const baseCandidates = urls
    .filter((url) => isValidHttpUrl(url))
    .filter((url) => {
      const host = new URL(url).host;
      return host === startHost || getRootDomain(host) === startRootDomain;
    })
    .filter((url) => !hasStaticAssetExtension(url));

  const excludeFiltered = baseCandidates.filter((url) => {
    const lower = url.toLowerCase();
    return !excludePatterns.some((pattern) => lower.includes(pattern));
  });

  const includeFiltered =
    includePatterns.length === 0
      ? excludeFiltered
      : excludeFiltered.filter((url) => {
          const lower = url.toLowerCase();
          return includePatterns.some((pattern) => lower.includes(pattern));
        });

  const includeFallbackUsed =
    includePatterns.length > 0 && includeFiltered.length === 0;

  const selected = includeFallbackUsed ? excludeFiltered : includeFiltered;

  return {
    urls: ensureUnique(selected),
    includeFallbackUsed,
  };
}

function buildExtractPrompt(sportSlug: string): string {
  return [
    "Extract a single sports venue listing from this page.",
    "Return JSON only with fields in schema.",
    "If a field is missing, return null or empty array.",
    "For courts, return an array of strings using one of:",
    "  - sport_slug",
    "  - sport_slug|tier_label",
    "  - label|sport_slug|tier_label",
    `If sport is unclear, use sport_slug "${sportSlug}".`,
    "Do not hallucinate values.",
  ].join("\n");
}

function normalizeStatus(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

async function pollExtract(
  apiKey: string,
  jobId: string,
  options: ScriptOptions,
): Promise<JsonObject> {
  const startedAt = Date.now();

  while (true) {
    const statusResponse = await firecrawlRequest(apiKey, `/extract/${jobId}`, {
      method: "GET",
    });
    const statusObj = toObject(statusResponse);
    if (!statusObj) {
      throw new Error("Unexpected extract status response");
    }

    const status = normalizeStatus(statusObj.status);
    if (EXTRACT_STATUS_DONE.has(status)) {
      return statusObj;
    }

    if (EXTRACT_STATUS_FAILED.has(status)) {
      throw new Error(`Firecrawl extract job failed (status: ${status})`);
    }

    if (Date.now() - startedAt > options.pollTimeoutMs) {
      throw new Error(
        `Timed out waiting for extract job ${jobId} after ${options.pollTimeoutMs}ms`,
      );
    }

    await sleep(options.pollIntervalMs);
  }
}

function responseHasExtractData(payload: JsonObject): boolean {
  if (Array.isArray(payload.data)) return payload.data.length > 0;
  const dataObj = toObject(payload.data);
  if (Array.isArray(dataObj?.data)) return dataObj.data.length > 0;
  if (Array.isArray(payload.results)) return payload.results.length > 0;
  return false;
}

async function runExtract(
  apiKey: string,
  options: ScriptOptions,
  urls: string[],
): Promise<JsonObject> {
  const response = await firecrawlRequest(apiKey, "/extract", {
    method: "POST",
    body: JSON.stringify({
      urls,
      prompt: buildExtractPrompt(options.sportSlug),
      schema: EXTRACT_SCHEMA,
    }),
  });

  const responseObject = toObject(response);
  if (!responseObject) {
    throw new Error("Unexpected extract response");
  }

  if (responseHasExtractData(responseObject)) {
    return responseObject;
  }

  const jobId = normalizeString(responseObject.id);
  if (!jobId) {
    return responseObject;
  }

  return pollExtract(apiKey, jobId, options);
}

function collectExtractItems(payload: JsonObject): JsonObject[] {
  const dataObject = toObject(payload.data);

  const buckets: unknown[] = [
    payload.data,
    payload.results,
    payload.output,
    dataObject?.data,
    dataObject?.results,
    dataObject?.output,
  ];

  const allItems = buckets.flatMap((bucket) =>
    Array.isArray(bucket) ? bucket : [],
  );

  return allItems
    .map((item) => toObject(item))
    .filter((item): item is JsonObject => Boolean(item));
}

function pickExtractedRecord(item: JsonObject): JsonObject {
  const nestedCandidates: unknown[] = [
    item.data,
    item.json,
    item.extract,
    item.output,
    item.result,
  ];

  for (const candidate of nestedCandidates) {
    const asObj = toObject(candidate);
    if (asObj) return asObj;
  }

  return item;
}

function pickSourceUrl(item: JsonObject, extracted: JsonObject): string {
  const itemMetadata = toObject(item.metadata);
  const extractedMetadata = toObject(extracted.metadata);

  const candidates: unknown[] = [
    item.url,
    item.source_url,
    item.sourceUrl,
    item.href,
    item.link,
    itemMetadata?.url,
    extracted.source_url,
    extracted.sourceUrl,
    extracted.url,
    extracted.href,
    extracted.link,
    extractedMetadata?.url,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeString(candidate);
    if (isValidHttpUrl(normalized)) {
      return normalized;
    }
  }

  return "";
}

function normalizeCourts(rawValue: unknown, sportSlug: string): string[] {
  const rawItems = toStringArray(rawValue);

  if (rawItems.length === 0) {
    return [`${sportSlug}|`];
  }

  const normalized = rawItems.map((item) => {
    if (item.includes("|")) return item;
    return `${item}|${sportSlug}|`;
  });

  return ensureUnique(normalized);
}

function sanitizeUrlValue(value: unknown): string {
  const normalized = normalizeString(value);
  if (!normalized) return "";
  return isValidHttpUrl(normalized) ? normalized : "";
}

function buildRowFromExtractedRecord(
  extracted: JsonObject,
  sportSlug: string,
): CuratedCsvRow | null {
  const name = normalizeString(extracted.name);
  const address = normalizeString(extracted.address);
  const city = normalizeString(extracted.city);
  const province = normalizeString(extracted.province);

  if (!name || !address || !city || !province) {
    return null;
  }

  const amenities = ensureUnique(toStringArray(extracted.amenities));
  const courts = normalizeCourts(extracted.courts, sportSlug);
  const photoUrls = ensureUnique(
    toStringArray(extracted.photo_urls).filter((url) => isValidHttpUrl(url)),
  );

  return {
    name,
    address,
    city,
    province,
    country: "PH",
    time_zone: "Asia/Manila",
    latitude: parseOptionalNumberAsString(extracted.latitude),
    longitude: parseOptionalNumberAsString(extracted.longitude),
    facebook_url: sanitizeUrlValue(extracted.facebook_url),
    instagram_url: sanitizeUrlValue(extracted.instagram_url),
    viber_contact: normalizeString(extracted.viber_contact),
    website_url: sanitizeUrlValue(extracted.website_url),
    other_contact_info: normalizeString(extracted.other_contact_info),
    amenities: amenities.join(";"),
    courts: courts.join(";"),
    photo_urls: photoUrls.join(","),
  };
}

function dedupeRowsWithSource(rows: RowWithSource[]): RowWithSource[] {
  const seen = new Set<string>();
  const deduped: RowWithSource[] = [];

  for (const item of rows) {
    const key = buildRowKey(item.row.name, item.row.city, item.row.province);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function dedupeRows(rows: CuratedCsvRow[]): CuratedCsvRow[] {
  const seen = new Set<string>();
  const deduped: CuratedCsvRow[] = [];

  for (const row of rows) {
    const key = buildRowKey(row.name, row.city, row.province);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

function inferCityProvinceFromAddress(address: string): {
  city: string;
  province: string;
} {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return { city: "Unknown", province: "Unknown" };
  }

  if (parts.length === 1) {
    return { city: parts[0], province: parts[0] };
  }

  let province = parts[parts.length - 1] ?? "Unknown";
  let city = parts[parts.length - 2] ?? province;

  if (/philippines/i.test(province) && parts.length >= 3) {
    province = parts[parts.length - 2] ?? province;
    city = parts[parts.length - 3] ?? city;
  }

  return {
    city: city.trim() || "Unknown",
    province: province.trim() || "Unknown",
  };
}

function buildRowFromSports360Storehub(
  hub: Sports360Storehub,
  sportSlug: string,
): CuratedCsvRow | null {
  const name = normalizeString(hub.sportsHubName);
  const address = normalizeString(hub.address);

  if (!name || !address) {
    return null;
  }

  const { city, province } = inferCityProvinceFromAddress(address);
  const phone = normalizeString(hub.hubContactNo);
  const email = normalizeString(hub.hubEmailAdd);
  const fullLoc = normalizeString(hub.fullLoc);

  const contactInfo = [email ? `Email: ${email}` : "", fullLoc]
    .filter((part) => part.length > 0)
    .join(" | ");

  return {
    name,
    address,
    city,
    province,
    country: "PH",
    time_zone: "Asia/Manila",
    latitude: "",
    longitude: "",
    facebook_url: "",
    instagram_url: "",
    viber_contact: phone,
    website_url: "",
    other_contact_info: contactInfo,
    amenities: "",
    courts: `${sportSlug}|`,
    photo_urls: "",
  };
}

function isSports360Host(startUrl: string): boolean {
  const host = new URL(startUrl).host.toLowerCase();
  return host.endsWith("sports360.ph");
}

function buildSports360StorehubPageUrl(
  startUrl: string,
  hubName: string,
): string {
  const origin = new URL(startUrl).origin;
  const slug = encodeURIComponent(hubName.trim());
  return `${origin}/sportshub/${slug}`;
}

async function fetchSports360Storehubs(
  startUrl: string,
): Promise<Sports360Storehub[]> {
  if (!isSports360Host(startUrl)) {
    return [];
  }

  const endpoint = `${new URL(startUrl).origin}/api/public/storehubs`;
  let parsed: unknown;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) return [];
    parsed = await response.json();
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => toObject(item))
    .filter((item): item is JsonObject => Boolean(item));
}

async function fetchSports360StorehubUrls(startUrl: string): Promise<string[]> {
  const hubs = await fetchSports360Storehubs(startUrl);
  const urls = hubs
    .map((hub) => normalizeString(hub.sportsHubName))
    .filter((name) => name.length > 0)
    .map((name) => buildSports360StorehubPageUrl(startUrl, name));

  return ensureUnique(urls);
}

async function fetchSports360FallbackRows(
  startUrl: string,
  sportSlug: string,
): Promise<RowWithSource[]> {
  const hubs = await fetchSports360Storehubs(startUrl);

  const rows = hubs
    .map((hub) => {
      const row = buildRowFromSports360Storehub(hub, sportSlug);
      if (!row) return null;

      const hubName = normalizeString(hub.sportsHubName);
      const sourceUrl = hubName
        ? buildSports360StorehubPageUrl(startUrl, hubName)
        : `${new URL(startUrl).origin}/api/public/storehubs`;

      return {
        row,
        sourceUrl,
      } satisfies RowWithSource;
    })
    .filter((item): item is RowWithSource => Boolean(item));

  return dedupeRowsWithSource(rows);
}

async function tryReadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function loadScrapeState(
  statePath: string,
  startUrl: string,
): Promise<ScrapeState> {
  const nowIso = new Date().toISOString();
  const fromDisk = await tryReadJsonFile<Partial<ScrapeState>>(statePath);

  if (!fromDisk || typeof fromDisk !== "object") {
    return {
      version: 1,
      startUrl,
      createdAt: nowIso,
      updatedAt: nowIso,
      urls: {},
      rows: {},
    };
  }

  return {
    version: 1,
    startUrl,
    createdAt:
      typeof fromDisk.createdAt === "string" ? fromDisk.createdAt : nowIso,
    updatedAt: nowIso,
    urls:
      fromDisk.urls && typeof fromDisk.urls === "object"
        ? (fromDisk.urls as Record<string, UrlStateEntry>)
        : {},
    rows:
      fromDisk.rows && typeof fromDisk.rows === "object"
        ? (fromDisk.rows as Record<string, RowStateEntry>)
        : {},
  };
}

async function saveScrapeState(
  statePath: string,
  state: ScrapeState,
): Promise<void> {
  const nextState: ScrapeState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  await ensureParentDir(statePath);
  await writeFile(statePath, JSON.stringify(nextState, null, 2), "utf-8");
}

function touchDiscoveredUrls(
  state: ScrapeState,
  urls: string[],
  discoveredAt: string,
): void {
  for (const url of urls) {
    const canonicalUrl = canonicalizeUrl(url);
    const existing = state.urls[canonicalUrl];
    if (!existing) {
      state.urls[canonicalUrl] = {
        canonicalUrl,
        latestUrl: url,
        firstDiscoveredAt: discoveredAt,
        lastDiscoveredAt: discoveredAt,
        attempts: 0,
        lastAttemptedAt: null,
        lastStatus: "discovered",
        lastError: null,
        lastRowKey: null,
        lastRowName: null,
      };
      continue;
    }

    existing.latestUrl = url;
    existing.lastDiscoveredAt = discoveredAt;
  }
}

function markAttemptedUrls(
  state: ScrapeState,
  urls: string[],
  attemptedAt: string,
): void {
  for (const url of urls) {
    const canonicalUrl = canonicalizeUrl(url);
    const existing = state.urls[canonicalUrl];
    if (!existing) {
      state.urls[canonicalUrl] = {
        canonicalUrl,
        latestUrl: url,
        firstDiscoveredAt: attemptedAt,
        lastDiscoveredAt: attemptedAt,
        attempts: 1,
        lastAttemptedAt: attemptedAt,
        lastStatus: "discovered",
        lastError: null,
        lastRowKey: null,
        lastRowName: null,
      };
      continue;
    }

    existing.latestUrl = url;
    existing.attempts += 1;
    existing.lastAttemptedAt = attemptedAt;
    existing.lastError = null;
  }
}

function markUrlFailed(
  state: ScrapeState,
  url: string,
  errorMessage: string,
  when: string,
): void {
  const canonicalUrl = canonicalizeUrl(url);
  const entry = state.urls[canonicalUrl];
  if (!entry) return;
  entry.lastStatus = "failed";
  entry.lastError = errorMessage;
  entry.lastAttemptedAt = when;
}

function markUrlNoData(state: ScrapeState, url: string, when: string): void {
  const canonicalUrl = canonicalizeUrl(url);
  const entry = state.urls[canonicalUrl];
  if (!entry) return;
  entry.lastStatus = "no_data";
  entry.lastError = null;
  entry.lastAttemptedAt = when;
}

function upsertRowState(
  state: ScrapeState,
  row: CuratedCsvRow,
  sourceUrl: string,
  seenAt: string,
): string {
  const rowKey = buildRowKey(row.name, row.city, row.province);
  const existing = state.rows[rowKey];

  if (!existing) {
    state.rows[rowKey] = {
      rowKey,
      name: row.name,
      city: row.city,
      province: row.province,
      sourceUrl,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
    };
  } else {
    existing.name = row.name;
    existing.city = row.city;
    existing.province = row.province;
    existing.sourceUrl = sourceUrl || existing.sourceUrl;
    existing.lastSeenAt = seenAt;
  }

  return rowKey;
}

function markUrlScraped(
  state: ScrapeState,
  sourceUrl: string,
  rowKey: string,
  rowName: string,
  when: string,
): void {
  if (!sourceUrl) return;
  const canonicalUrl = canonicalizeUrl(sourceUrl);
  const entry = state.urls[canonicalUrl];
  if (!entry) return;
  entry.lastStatus = "scraped";
  entry.lastError = null;
  entry.lastAttemptedAt = when;
  entry.lastRowKey = rowKey;
  entry.lastRowName = rowName;
}

function selectUrlsForThisRun(
  candidateUrls: string[],
  state: ScrapeState,
  options: ScriptOptions,
): {
  urlsToScrape: string[];
  skippedAlreadyScraped: string[];
} {
  const allCandidates = candidateUrls
    .map((url) => normalizeString(url))
    .filter((url) => isValidHttpUrl(url));

  if (options.rescrapeAll) {
    return {
      urlsToScrape: ensureUnique(allCandidates).slice(0, options.maxUrls),
      skippedAlreadyScraped: [],
    };
  }

  const skippedAlreadyScraped: string[] = [];
  const urlsToScrape: string[] = [];

  for (const url of allCandidates) {
    const canonicalUrl = canonicalizeUrl(url);
    const stateEntry = state.urls[canonicalUrl];
    if (stateEntry && isLikelyAlreadyScraped(stateEntry)) {
      skippedAlreadyScraped.push(url);
      continue;
    }
    urlsToScrape.push(url);
  }

  return {
    urlsToScrape: ensureUnique(urlsToScrape).slice(0, options.maxUrls),
    skippedAlreadyScraped: ensureUnique(skippedAlreadyScraped),
  };
}

async function fetchExistingCuratedPlaces(
  connectionString: string,
): Promise<ExistingCuratedPlace[]> {
  const client = postgres(connectionString);
  try {
    const rows = await client.unsafe<ExistingCuratedPlace[]>(`
      select id, name, city, province
      from place
      where place_type = 'CURATED'
    `);
    return rows;
  } finally {
    await client.end();
  }
}

async function main() {
  const options = parseArgs();

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }

  const resolvedOutputPath = path.resolve(process.cwd(), options.outputPath);
  const resolvedRawPath = path.resolve(process.cwd(), options.rawOutputPath);
  const resolvedStatePath = path.resolve(process.cwd(), options.statePath);
  const resolvedCoveragePath = path.resolve(
    process.cwd(),
    options.coverageOutputPath,
  );
  const runAt = new Date().toISOString();

  const state = await loadScrapeState(resolvedStatePath, options.startUrl);

  let sourceUrls = options.urlsFilePath
    ? await loadUrlsFromFile(options.urlsFilePath)
    : await mapUrls(options, apiKey);

  if (!options.urlsFilePath && sourceUrls.length === 0) {
    console.log("Firecrawl map returned no links. Trying sitemap fallback...");
    sourceUrls = await getSitemapUrls(options.startUrl);
  }

  if (sourceUrls.length === 0) {
    throw new Error(
      "No source URLs found. Try passing explicit URLs via --urls-file.",
    );
  }

  if (!options.urlsFilePath) {
    const sitemapExpandedUrls = await expandSitemapUrls(sourceUrls);
    if (sitemapExpandedUrls.length > 0) {
      sourceUrls = ensureUnique([...sourceUrls, ...sitemapExpandedUrls]);
    }

    const sports360StorehubUrls = await fetchSports360StorehubUrls(
      options.startUrl,
    );
    if (sports360StorehubUrls.length > 0) {
      sourceUrls = ensureUnique([...sourceUrls, ...sports360StorehubUrls]);
    }
  }

  touchDiscoveredUrls(state, sourceUrls, runAt);

  const candidateSelection = selectCandidateUrls(sourceUrls, options);
  const allCandidateUrls = candidateSelection.urls;
  const runUrlSelection = selectUrlsForThisRun(
    allCandidateUrls,
    state,
    options,
  );
  const candidateUrls = runUrlSelection.urlsToScrape;
  const skippedAlreadyScrapedUrls = runUrlSelection.skippedAlreadyScraped;

  console.log(`Mapped URLs: ${sourceUrls.length}`);
  console.log(`Candidate URLs (pre-state): ${allCandidateUrls.length}`);
  console.log(`Candidate URLs (this run): ${candidateUrls.length}`);
  if (!options.rescrapeAll && skippedAlreadyScrapedUrls.length > 0) {
    console.log(
      `Skipped already-scraped URLs: ${skippedAlreadyScrapedUrls.length}`,
    );
  }
  if (candidateSelection.includeFallbackUsed) {
    console.log(
      "No URLs matched --include patterns. Falling back to broad selection.",
    );
  }

  let rowsWithSource: RowWithSource[] = [];
  let extractItems: JsonObject[] = [];
  let usedSports360ApiFallback = false;
  let usedDiscoverOnlyMode = false;

  if (options.discoverOnly) {
    usedDiscoverOnlyMode = true;
    console.log("Discover-only mode enabled. Skipping extraction step.");
  } else if (candidateUrls.length > 0) {
    markAttemptedUrls(state, candidateUrls, runAt);
    let extractPayload: JsonObject;
    try {
      extractPayload = await runExtract(apiKey, options, candidateUrls);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown extract error";
      for (const url of candidateUrls) {
        markUrlFailed(state, url, message, runAt);
      }
      throw error;
    }

    extractItems = collectExtractItems(extractPayload);

    const attemptedSet = new Set(
      candidateUrls.map((url) => canonicalizeUrl(url)),
    );
    if (extractItems.length === 0) {
      for (const url of candidateUrls) {
        markUrlNoData(state, url, runAt);
      }
    } else {
      const mappedRows = extractItems
        .map((item) => {
          const record = pickExtractedRecord(item);
          const row = buildRowFromExtractedRecord(record, options.sportSlug);
          if (!row) return null;

          const sourceUrl = pickSourceUrl(item, record);
          return {
            row,
            sourceUrl,
          } satisfies RowWithSource;
        })
        .filter((item): item is RowWithSource => Boolean(item));

      rowsWithSource = dedupeRowsWithSource(mappedRows);

      const urlsWithRows = new Set<string>();
      for (const item of rowsWithSource) {
        const rowKey = upsertRowState(state, item.row, item.sourceUrl, runAt);
        if (item.sourceUrl) {
          const canonical = canonicalizeUrl(item.sourceUrl);
          urlsWithRows.add(canonical);
          markUrlScraped(state, item.sourceUrl, rowKey, item.row.name, runAt);
        }
      }

      for (const attemptedUrl of attemptedSet) {
        if (!urlsWithRows.has(attemptedUrl)) {
          markUrlNoData(state, attemptedUrl, runAt);
        }
      }
    }
  }

  if (!options.discoverOnly && rowsWithSource.length === 0) {
    const fallbackRows = await fetchSports360FallbackRows(
      options.startUrl,
      options.sportSlug,
    );
    if (fallbackRows.length > 0) {
      rowsWithSource = fallbackRows;
      usedSports360ApiFallback = true;
      const fallbackUrls = rowsWithSource
        .map((item) => item.sourceUrl)
        .filter((url) => isValidHttpUrl(url));
      touchDiscoveredUrls(state, fallbackUrls, runAt);
      markAttemptedUrls(state, fallbackUrls, runAt);
      for (const item of rowsWithSource) {
        const rowKey = upsertRowState(state, item.row, item.sourceUrl, runAt);
        markUrlScraped(state, item.sourceUrl, rowKey, item.row.name, runAt);
      }
    }
  }

  const rows = dedupeRows(rowsWithSource.map((item) => item.row));

  if (!options.discoverOnly && rows.length === 0) {
    throw new Error(
      "No candidate URLs after filtering and no fallback rows found. Use --urls-file with explicit venue URLs.",
    );
  }
  if (usedSports360ApiFallback) {
    console.log(
      `No crawlable candidate pages found. Using Sports360 public API fallback (${rows.length} rows).`,
    );
  }

  const discoveredRows = Object.values(state.rows);
  const urlEntries = Object.values(state.urls);
  const discoveredUrlCount = urlEntries.length;
  const scrapedUrlCount = urlEntries.filter(
    (entry) => entry.lastStatus === "scraped",
  ).length;
  const noDataUrlCount = urlEntries.filter(
    (entry) => entry.lastStatus === "no_data",
  ).length;
  const failedUrlCount = urlEntries.filter(
    (entry) => entry.lastStatus === "failed",
  ).length;
  const pendingUrlCount = urlEntries.filter(
    (entry) => entry.lastStatus === "discovered",
  ).length;

  const dbCoverageEnabled =
    !options.skipDbCoverage && Boolean(process.env.DATABASE_URL);
  let existingCuratedPlaces: ExistingCuratedPlace[] = [];

  if (!dbCoverageEnabled && !options.skipDbCoverage) {
    console.log(
      "DATABASE_URL is not set; coverage report will skip migrated-vs-pending checks.",
    );
  }

  if (dbCoverageEnabled && process.env.DATABASE_URL) {
    existingCuratedPlaces = await fetchExistingCuratedPlaces(
      process.env.DATABASE_URL,
    );
  }

  const existingKeyMap = new Map<string, ExistingCuratedPlace>();
  for (const place of existingCuratedPlaces) {
    const key = buildRowKey(place.name, place.city, place.province);
    if (!existingKeyMap.has(key)) {
      existingKeyMap.set(key, place);
    }
  }

  const pendingMigrationRows = discoveredRows
    .filter((entry) => !existingKeyMap.has(entry.rowKey))
    .map((entry) => ({
      rowKey: entry.rowKey,
      name: entry.name,
      city: entry.city,
      province: entry.province,
      sourceUrl: entry.sourceUrl,
      firstSeenAt: entry.firstSeenAt,
      lastSeenAt: entry.lastSeenAt,
    }));

  const coverageOutput = {
    generatedAt: runAt,
    startUrl: options.startUrl,
    dbCoverageEnabled,
    discoveredUrls: discoveredUrlCount,
    scrapedUrls: scrapedUrlCount,
    noDataUrls: noDataUrlCount,
    failedUrls: failedUrlCount,
    pendingDiscoveryUrls: pendingUrlCount,
    discoveredRows: discoveredRows.length,
    migratedRows: discoveredRows.length - pendingMigrationRows.length,
    pendingMigrationRows: pendingMigrationRows.length,
    pending: pendingMigrationRows,
  };

  const csv = buildCsv(rows);

  const rawOutput = {
    generatedAt: runAt,
    startUrl: options.startUrl,
    sportSlug: options.sportSlug,
    sourceUrlsCount: sourceUrls.length,
    candidateUrlsCount: allCandidateUrls.length,
    candidateUrlsSelectedForRunCount: candidateUrls.length,
    skippedAlreadyScrapedUrlsCount: skippedAlreadyScrapedUrls.length,
    sourceUrls,
    candidateUrls: allCandidateUrls,
    candidateUrlsSelectedForRun: candidateUrls,
    skippedAlreadyScrapedUrls,
    usedSports360ApiFallback,
    usedDiscoverOnlyMode,
    extractItems,
    coverageSummary: {
      discoveredRows: discoveredRows.length,
      pendingMigrationRows: pendingMigrationRows.length,
      dbCoverageEnabled,
    },
  };

  if (options.dryRun) {
    console.log(`Dry run complete. Valid rows: ${rows.length}`);
    console.log(
      JSON.stringify(
        {
          previewRows: rows.slice(0, 5),
          outputPath: resolvedOutputPath,
          rawOutputPath: resolvedRawPath,
          statePath: resolvedStatePath,
          coverageOutputPath: resolvedCoveragePath,
          skippedAlreadyScrapedUrls: skippedAlreadyScrapedUrls.length,
          coverageSummary: {
            discoveredRows: discoveredRows.length,
            pendingMigrationRows: pendingMigrationRows.length,
            dbCoverageEnabled,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  await ensureParentDir(resolvedOutputPath);
  await ensureParentDir(resolvedRawPath);
  await ensureParentDir(resolvedCoveragePath);
  await ensureParentDir(resolvedStatePath);

  const writeTasks: Array<Promise<void>> = [
    saveScrapeState(resolvedStatePath, state),
    writeFile(resolvedRawPath, JSON.stringify(rawOutput, null, 2), "utf-8"),
    writeFile(
      resolvedCoveragePath,
      JSON.stringify(coverageOutput, null, 2),
      "utf-8",
    ),
  ];
  if (!options.discoverOnly) {
    writeTasks.push(writeFile(resolvedOutputPath, csv, "utf-8"));
  }
  await Promise.all(writeTasks);

  if (!options.discoverOnly) {
    console.log(`Wrote ${rows.length} curated rows to ${resolvedOutputPath}`);
  }
  console.log(`Wrote extraction audit JSON to ${resolvedRawPath}`);
  console.log(`Wrote scrape state to ${resolvedStatePath}`);
  console.log(`Wrote coverage report to ${resolvedCoveragePath}`);
  console.log(
    `Pending migration rows (from discovered inventory): ${pendingMigrationRows.length}`,
  );
  console.log(
    options.discoverOnly
      ? "Next: rerun without --discover-only to scrape only new URLs."
      : `Next: pnpm db:import:curated-courts -- --file ${options.outputPath} --dry-run`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
