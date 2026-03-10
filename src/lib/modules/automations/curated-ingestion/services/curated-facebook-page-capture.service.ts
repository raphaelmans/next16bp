/**
 * Capture public Facebook page leads into import-ready curated-courts CSV rows.
 *
 * Pipeline:
 *   facebook page urls.txt -> playwright-cli capture -> AI extraction -> CSV rows
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type BrowserContext, chromium, type Page } from "playwright";
import { z } from "zod";
import {
  CuratedFacebookPageCaptureStateRepository,
  type FacebookPageCaptureStateEntry,
} from "../repositories/curated-facebook-page-capture-state.repository";
import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../shared/cli-runtime";
import {
  type ResolvedCuratedDiscoveryScope,
  resolveCuratedDiscoveryScopeOrThrow,
  resolveDefaultCuratedDiscoveryScopes,
} from "../shared/curated-discovery-scopes";
import {
  canonicalizeLeadUrl,
  normalizeLocationSlug,
} from "../shared/url-normalization";

interface ScriptOptions {
  province: string | null;
  city: string | null;
  sportSlug: string;
  urlsPath: string | null;
  captureOutputPath: string | null;
  statePath: string | null;
  csvOutputPath: string | null;
  reportOutputPath: string | null;
  model: string;
  limit: number | null;
  dryRun: boolean;
  recaptureAll: boolean;
}

interface CapturedPagePayload {
  pageUrl: string;
  title: string;
  bodyText: string;
  links: string[];
  ogTitle: string;
  ogDescription: string;
}

interface CapturedPageRecord {
  url: string;
  canonicalUrl: string;
  capturedAt: string;
  payload: CapturedPagePayload | null;
  analysis: FacebookPageAnalysis | null;
  error: string | null;
}

interface ExistingCaptureOutput {
  captured?: CapturedPageRecord[];
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

interface PlaywrightSession {
  context: BrowserContext;
  page: Page;
}

const FACEBOOK_PAGE_ANALYSIS_SCHEMA = z.object({
  status: z.enum(["ready", "review", "skip"]),
  confidence: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  name: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  amenities: z.array(z.string()),
  courtCount: z.number().int().min(1).max(30).nullable(),
  isVenue: z.boolean(),
  isWithinScope: z.boolean(),
  evidence: z.array(z.string()),
});

type FacebookPageAnalysis = z.infer<typeof FACEBOOK_PAGE_ANALYSIS_SCHEMA>;

const DEFAULT_LIMIT = 10;
const DEFAULT_OPTIONS: ScriptOptions = {
  province: null,
  city: null,
  sportSlug: "pickleball",
  urlsPath: null,
  captureOutputPath: null,
  statePath: null,
  csvOutputPath: null,
  reportOutputPath: null,
  model: "gpt-5-mini",
  limit: DEFAULT_LIMIT,
  dryRun: false,
  recaptureAll: false,
};

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = { ...DEFAULT_OPTIONS };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--recapture-all") {
      options.recaptureAll = true;
      continue;
    }
    if (arg === "--province") {
      const value = args[index + 1];
      if (!value) throw new Error("--province requires a value");
      options.province = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--province=")) {
      options.province = arg.replace("--province=", "");
      continue;
    }
    if (arg === "--city") {
      const value = args[index + 1];
      if (!value) throw new Error("--city requires a value");
      options.city = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--city=")) {
      options.city = arg.replace("--city=", "");
      continue;
    }
    if (arg === "--sport-slug") {
      const value = args[index + 1];
      if (!value) throw new Error("--sport-slug requires a value");
      options.sportSlug = value.trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--sport-slug=")) {
      options.sportSlug = arg.replace("--sport-slug=", "").trim();
      continue;
    }
    if (arg === "--urls-file") {
      const value = args[index + 1];
      if (!value) throw new Error("--urls-file requires a value");
      options.urlsPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--urls-file=")) {
      options.urlsPath = arg.replace("--urls-file=", "");
      continue;
    }
    if (arg === "--capture-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--capture-output requires a value");
      options.captureOutputPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--capture-output=")) {
      options.captureOutputPath = arg.replace("--capture-output=", "");
      continue;
    }
    if (arg === "--state") {
      const value = args[index + 1];
      if (!value) throw new Error("--state requires a value");
      options.statePath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--state=")) {
      options.statePath = arg.replace("--state=", "");
      continue;
    }
    if (arg === "--csv-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--csv-output requires a value");
      options.csvOutputPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--csv-output=")) {
      options.csvOutputPath = arg.replace("--csv-output=", "");
      continue;
    }
    if (arg === "--report-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--report-output requires a value");
      options.reportOutputPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--report-output=")) {
      options.reportOutputPath = arg.replace("--report-output=", "");
      continue;
    }
    if (arg === "--model") {
      const value = args[index + 1];
      if (!value) throw new Error("--model requires a value");
      options.model = value.trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--model=")) {
      options.model = arg.replace("--model=", "").trim();
      continue;
    }
    if (arg === "--limit") {
      const value = args[index + 1];
      if (!value) throw new Error("--limit requires a value");
      options.limit = parsePositiveInt(value, "--limit");
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInt(arg.replace("--limit=", ""), "--limit");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (
    (options.province && !options.city) ||
    (!options.province && options.city)
  ) {
    throw new Error("--province and --city must be provided together");
  }

  return options;
}

function buildFacebookCapturePaths(scope: ResolvedCuratedDiscoveryScope) {
  const baseDir = path.join(
    "scripts",
    "output",
    "discovery-facebook",
    normalizeLocationSlug(scope.sportSlug),
    scope.provinceSlug,
    scope.citySlug,
  );

  return {
    urlsPath: path.join(baseDir, "facebook-pages.urls.txt"),
    captureOutputPath: path.join(baseDir, "facebook-pages.captured.json"),
    statePath: path.join(baseDir, "facebook-pages.capture-state.json"),
    csvOutputPath: path.join(baseDir, "facebook-pages-curated-courts.csv"),
    reportPath: path.join(baseDir, "facebook-pages.capture-report.json"),
  };
}

async function readUrlsFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf-8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function loadExistingCapturedRecords(
  filePath: string,
): Promise<CapturedPageRecord[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as ExistingCaptureOutput;
    return Array.isArray(parsed.captured) ? parsed.captured : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function isMissingPlaywrightBrowserError(
  browser: string,
  error: unknown,
): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes(`distribution '${browser}' is not found`) ||
    message.includes(`Executable doesn't exist at`) ||
    message.includes(`browserType.launchPersistentContext`) ||
    message.includes(`channel "${browser}"`)
  );
}

function buildPlaywrightUserDataDir(sessionName: string): string {
  return path.join(process.cwd(), ".playwright-facebook", sessionName);
}

async function openPlaywrightSession(
  sessionName: string,
): Promise<PlaywrightSession> {
  const requestedBrowser = process.env.PLAYWRIGHT_CLI_BROWSER?.trim();
  const browserCandidates =
    requestedBrowser === "chromium"
      ? [{ browser: "chromium", channel: undefined }]
      : [
          { browser: requestedBrowser || "chrome", channel: "chrome" as const },
          { browser: "chromium", channel: undefined },
        ];
  const userDataDir = buildPlaywrightUserDataDir(sessionName);
  await mkdir(userDataDir, { recursive: true });

  let lastError: unknown = null;
  for (const candidate of browserCandidates) {
    try {
      const context = await chromium.launchPersistentContext(userDataDir, {
        channel: candidate.channel,
        headless: true,
        viewport: {
          width: 1280,
          height: 900,
        },
      });
      context.setDefaultNavigationTimeout(45_000);
      context.setDefaultTimeout(45_000);

      const page = context.pages()[0] ?? (await context.newPage());
      await page.goto("about:blank", { waitUntil: "domcontentloaded" });

      return { context, page };
    } catch (error) {
      lastError = error;
      if (!isMissingPlaywrightBrowserError(candidate.browser, error)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Failed to open Playwright session");
}

async function closePlaywrightSession(session: PlaywrightSession) {
  try {
    await session.context.close();
  } catch {
    // ignore close errors
  }
}

async function capturePagePayload(
  session: PlaywrightSession,
  url: string,
): Promise<CapturedPagePayload> {
  const page = session.page.isClosed()
    ? await session.context.newPage()
    : session.page;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(1_500);

  const payload = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => anchor.href)
      .filter(Boolean)
      .slice(0, 200);
    const ogTitle =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") ?? "";
    const ogDescription =
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") ?? "";

    return {
      pageUrl: location.href,
      title: document.title,
      bodyText: document.body ? document.body.innerText.slice(0, 16000) : "",
      links,
      ogTitle,
      ogDescription,
    };
  });

  session.page = page;
  return payload satisfies CapturedPagePayload;
}

function buildCourtValue(courtCount: number | null): string {
  const total = courtCount && courtCount > 0 ? Math.min(courtCount, 20) : 1;
  return Array.from(
    { length: total },
    (_, index) => `Court ${index + 1}|pickleball|`,
  ).join(";");
}

function escapeCsv(value: string): string {
  if (!value) return "";
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function toCsv(rows: CuratedCsvRow[]): string {
  const headers: (keyof CuratedCsvRow)[] = [
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

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function uniqueAmenities(values: string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  );
}

function normalizeMaybeUrl(value: string | null | undefined): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return trimmed;
    }
  }
}

function buildOtherContactInfo(analysis: FacebookPageAnalysis): string {
  const parts = [analysis.email].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  return parts.join("; ");
}

function buildCsvRow(
  scope: ResolvedCuratedDiscoveryScope,
  facebookUrl: string,
  analysis: FacebookPageAnalysis,
): CuratedCsvRow {
  return {
    name: analysis.name?.trim() ?? "",
    address: analysis.address?.trim() ?? "",
    city: scope.cityName.toUpperCase(),
    province: scope.provinceName.toUpperCase(),
    country: "PH",
    time_zone: "Asia/Manila",
    latitude: "",
    longitude: "",
    facebook_url: facebookUrl,
    instagram_url: normalizeMaybeUrl(analysis.instagramUrl),
    viber_contact: analysis.phone?.trim() ?? "",
    website_url: normalizeMaybeUrl(analysis.websiteUrl),
    other_contact_info: buildOtherContactInfo(analysis),
    amenities: uniqueAmenities(analysis.amenities).join(";"),
    courts: buildCourtValue(analysis.courtCount),
    photo_urls: "",
  };
}

function hasReadyVenueAnalysis(
  item: CapturedPageRecord,
): item is CapturedPageRecord & { analysis: FacebookPageAnalysis } {
  return (
    item.analysis !== null &&
    item.analysis.status === "ready" &&
    item.analysis.isVenue &&
    item.analysis.isWithinScope &&
    Boolean(item.analysis.name?.trim()) &&
    Boolean(item.analysis.address?.trim())
  );
}

function getPrompt(
  scope: ResolvedCuratedDiscoveryScope,
  payload: CapturedPagePayload,
) {
  return [
    "You normalize a public Facebook page lead into a curated pickleball venue row for a Philippines database.",
    `Scope province: ${scope.provinceName}`,
    `Scope city: ${scope.cityName}`,
    "",
    "Rules:",
    "- Use only the page content provided. Do not invent missing details.",
    "- Mark status='ready' only if the page clearly represents a physical venue/club/place where people can play pickleball and the content contains a usable location or address in the requested scope.",
    "- Mark status='skip' for community associations, software/booking brands, news pages, groups, or pages without enough venue/location evidence.",
    "- Mark status='review' only for borderline cases that look like a venue but lack one required field.",
    "- Keep address exactly as evidenced by the page text, even if rough or repetitive.",
    "- Only provide phone, email, Instagram, website, amenities, or courtCount when explicitly present.",
    "- isWithinScope must be false if the page obviously points to a different city or province.",
    "",
    `Source URL: ${payload.pageUrl}`,
    `Page title: ${payload.title}`,
    `OG title: ${payload.ogTitle}`,
    `OG description: ${payload.ogDescription}`,
    "Visible body text:",
    payload.bodyText,
    "",
    "Known outbound links:",
    payload.links.join("\n"),
  ].join("\n");
}

async function analyzeCapturedPage(
  scope: ResolvedCuratedDiscoveryScope,
  payload: CapturedPagePayload,
  model: string,
): Promise<FacebookPageAnalysis> {
  const { object } = await generateObject({
    model: openai(model),
    schema: FACEBOOK_PAGE_ANALYSIS_SCHEMA,
    prompt: getPrompt(scope, payload),
  });

  return object;
}

function hasAnyKeyword(value: string, keywords: string[]): boolean {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function postProcessAnalysis(
  scope: ResolvedCuratedDiscoveryScope,
  payload: CapturedPagePayload,
  analysis: FacebookPageAnalysis,
): FacebookPageAnalysis {
  if (analysis.status !== "ready") {
    return analysis;
  }

  const body = payload.bodyText.toLowerCase();
  const address = (analysis.address ?? "").toLowerCase();
  const communityKeywords = [
    "sports team",
    "amateur sports team",
    "association",
    "federation",
    "community",
    "organization",
  ];
  const strongVenueKeywords = [
    "court",
    "courts",
    "compound",
    "street",
    "st.",
    "road",
    "rd.",
    "avenue",
    "ave",
    "extension",
    "ext.",
    "building",
    "bldg",
    "gym",
    "sports center",
    "clubhouse",
    "village",
    "subdivision",
    "barangay",
    "brgy",
    "purok",
    "phase",
    "park",
    "mall",
    "plaza",
  ];
  const scopeCity = scope.cityName.toLowerCase();
  const scopeCityBase = scopeCity.replace(/\s+city$/i, "").trim();
  const scopeProvince = scope.provinceName.toLowerCase();

  const isCommunityPage = hasAnyKeyword(body, communityKeywords);
  const hasVenueSignals =
    hasAnyKeyword(body, strongVenueKeywords) ||
    hasAnyKeyword(payload.title, ["court", "courts", "sports center", "gym"]);
  const hasStrongAddress = hasAnyKeyword(address, strongVenueKeywords);

  if (isCommunityPage && (!hasVenueSignals || !hasStrongAddress)) {
    return {
      ...analysis,
      status: "review",
      reason:
        "Page looks like a team/community lead, but the captured content does not show strong enough venue/facility evidence for direct import.",
    };
  }

  const normalizedAddress = (analysis.address ?? "").toLowerCase();
  const addressMentionsScope =
    normalizedAddress.includes(scopeCity) ||
    (scopeCityBase.length > 0 && normalizedAddress.includes(scopeCityBase)) ||
    normalizedAddress.includes(scopeProvince);
  const addressSegmentCount = normalizedAddress
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0).length;
  if (!addressMentionsScope) {
    return {
      ...analysis,
      status: "review",
      reason:
        "Captured address does not explicitly confirm the requested city/province scope strongly enough for direct import.",
    };
  }

  if (!hasStrongAddress && addressSegmentCount < 4) {
    return {
      ...analysis,
      status: "review",
      reason:
        "Captured address is too coarse for direct import. Keep this as a review lead until a stronger venue-level address is confirmed.",
    };
  }

  return analysis;
}

function buildSessionName(scope: ResolvedCuratedDiscoveryScope) {
  return `fbcap-${scope.provinceSlug}-${scope.citySlug}`.slice(0, 48);
}

function dedupeRows(rows: CuratedCsvRow[]): CuratedCsvRow[] {
  const seen = new Set<string>();
  const deduped: CuratedCsvRow[] = [];

  for (const row of rows) {
    const key = [
      row.name.trim().toLowerCase(),
      row.address.trim().toLowerCase(),
      row.city.trim().toLowerCase(),
      row.province.trim().toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

async function runScope(
  scope: ResolvedCuratedDiscoveryScope,
  options: ScriptOptions,
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const paths = buildFacebookCapturePaths(scope);
  const urlsPath = options.urlsPath ?? paths.urlsPath;
  const captureOutputPath =
    options.captureOutputPath ?? paths.captureOutputPath;
  const statePath = options.statePath ?? paths.statePath;
  const csvOutputPath = options.csvOutputPath ?? paths.csvOutputPath;
  const reportOutputPath = options.reportOutputPath ?? paths.reportPath;
  const scopeKey = `${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}`;
  const repository = new CuratedFacebookPageCaptureStateRepository();
  const state = await repository.load(statePath, scopeKey);
  const existingCapturedRecords = options.recaptureAll
    ? []
    : await loadExistingCapturedRecords(captureOutputPath);
  const capturedByUrl = new Map(
    existingCapturedRecords.map((record) => [record.canonicalUrl, record]),
  );
  const discoveredUrls = await readUrlsFile(urlsPath);
  const targetUrls =
    options.limit === null
      ? discoveredUrls
      : discoveredUrls.slice(0, options.limit);
  const sessionName = buildSessionName(scope);
  const currentRunCaptured: CapturedPageRecord[] = [];
  let skippedExistingCount = 0;

  const session = await openPlaywrightSession(sessionName);

  try {
    for (const originalUrl of targetUrls) {
      const canonicalUrl = canonicalizeLeadUrl(originalUrl);
      const previous = state.urls[canonicalUrl];
      if (previous && !options.recaptureAll && previous.status === "captured") {
        skippedExistingCount += 1;
        continue;
      }

      const capturedAt = new Date().toISOString();

      try {
        const payload = await capturePagePayload(session, originalUrl);
        const analysis = postProcessAnalysis(
          scope,
          payload,
          await analyzeCapturedPage(scope, payload, options.model),
        );
        const record: CapturedPageRecord = {
          url: originalUrl,
          canonicalUrl,
          capturedAt,
          payload,
          analysis,
          error: null,
        };
        currentRunCaptured.push(record);
        capturedByUrl.set(canonicalUrl, record);

        const nextStateEntry: FacebookPageCaptureStateEntry = {
          canonicalUrl,
          latestUrl: originalUrl,
          firstCapturedAt: previous?.firstCapturedAt ?? capturedAt,
          lastCapturedAt: capturedAt,
          status: "captured",
          title: payload.title || null,
          venueName: analysis.name?.trim() || null,
          confidence: analysis.confidence,
          importStatus: analysis.status,
          error: null,
          outputRowName:
            analysis.status === "ready" ? analysis.name?.trim() || null : null,
        };
        state.urls[canonicalUrl] = nextStateEntry;
      } catch (error) {
        const record: CapturedPageRecord = {
          url: originalUrl,
          canonicalUrl,
          capturedAt,
          payload: null,
          analysis: null,
          error: error instanceof Error ? error.message : String(error),
        };
        currentRunCaptured.push(record);
        capturedByUrl.set(canonicalUrl, record);

        state.urls[canonicalUrl] = {
          canonicalUrl,
          latestUrl: originalUrl,
          firstCapturedAt: previous?.firstCapturedAt ?? capturedAt,
          lastCapturedAt: capturedAt,
          status: "failed",
          title: null,
          venueName: null,
          confidence: null,
          importStatus: null,
          error: record.error,
          outputRowName: null,
        };
      }
    }
  } finally {
    await closePlaywrightSession(session);
  }

  const allCapturedRecords = Array.from(capturedByUrl.values());
  const rows = allCapturedRecords
    .filter(hasReadyVenueAnalysis)
    .map((item) => buildCsvRow(scope, item.url, item.analysis));
  const dedupedRows = dedupeRows(rows);
  const report = {
    scope,
    generatedAt: new Date().toISOString(),
    urlsPath: path.resolve(process.cwd(), urlsPath),
    captureOutputPath: path.resolve(process.cwd(), captureOutputPath),
    statePath: path.resolve(process.cwd(), statePath),
    csvOutputPath: path.resolve(process.cwd(), csvOutputPath),
    processedUrlCount: targetUrls.length,
    skippedAlreadyCapturedCount: skippedExistingCount,
    capturedCount: currentRunCaptured.filter((item) => !item.error).length,
    failedCount: currentRunCaptured.filter((item) => item.error).length,
    readyCount: currentRunCaptured.filter(
      (item) => item.analysis?.status === "ready",
    ).length,
    reviewCount: currentRunCaptured.filter(
      (item) => item.analysis?.status === "review",
    ).length,
    skipCount: currentRunCaptured.filter(
      (item) => item.analysis?.status === "skip",
    ).length,
    csvRowCount: dedupedRows.length,
    failures: currentRunCaptured
      .filter((item) => item.error)
      .map((item) => ({
        url: item.url,
        error: item.error,
      })),
  };

  if (!options.dryRun) {
    await mkdir(path.dirname(captureOutputPath), { recursive: true });
    await writeFile(
      captureOutputPath,
      `${JSON.stringify({ scope, generatedAt: report.generatedAt, captured: allCapturedRecords }, null, 2)}\n`,
      "utf-8",
    );
    await writeFile(csvOutputPath, toCsv(dedupedRows), "utf-8");
    await writeFile(
      reportOutputPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf-8",
    );
    await repository.save(statePath, state);
  }

  console.log(`Scope: ${scope.provinceSlug} / ${scope.citySlug}`);
  console.log(`Processed URLs: ${report.processedUrlCount}`);
  console.log(`Captured pages: ${report.capturedCount}`);
  console.log(`Ready rows: ${report.csvRowCount}`);
  console.log(`Reviews: ${report.reviewCount}`);
  console.log(
    `Skipped existing captures: ${report.skippedAlreadyCapturedCount}`,
  );
  console.log(`Failures: ${report.failedCount}`);
  for (const failure of report.failures.slice(0, 5)) {
    console.log(`Failure: ${failure.url}`);
    console.log(`  ${failure.error}`);
  }

  return report;
}

export async function runCuratedFacebookPageCaptureCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, async () => {
    const options = parseArgs();
    const scopes =
      options.province && options.city
        ? [
            await resolveCuratedDiscoveryScopeOrThrow({
              sportSlug: options.sportSlug,
              provinceValue: options.province,
              cityValue: options.city,
            }),
          ]
        : await resolveDefaultCuratedDiscoveryScopes();

    for (const scope of scopes) {
      await runScope(scope, options);
    }
  });
}

if (isDirectExecution(import.meta.url)) {
  runCuratedFacebookPageCaptureCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
