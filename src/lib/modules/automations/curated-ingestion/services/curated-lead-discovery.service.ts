/**
 * Discover curated-ingestion lead URLs from web search.
 *
 * Usage:
 *   pnpm scrape:curated:discover -- --province cebu --city "cebu city"
 *   pnpm scrape:curated:discover -- --province cebu --city "cebu city" --dry-run
 *   pnpm scrape:curated:discover-and-scrape -- --province cebu --city "cebu city"
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { CuratedLeadDiscoveryStateRepository } from "../repositories/curated-lead-discovery-state.repository";
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
  buildKnownDomainQueries,
  classifyDiscoveryUrl,
  getDiscoveryDomainConfigsByStrategy,
} from "../shared/lead-source-strategy";
import { buildCuratedLeadQueryPlan } from "../shared/query-builder";
import {
  type DiscoverySearchResult,
  scoreDiscoverySearchResult,
} from "../shared/relevance-scoring";
import { buildCuratedDiscoveryScopePaths } from "../shared/scope-paths";
import { canonicalizeLeadUrl } from "../shared/url-normalization";
import { runFirecrawlCuratedCourtsCli } from "./firecrawl-curated-courts.service";

interface ScriptOptions {
  province: string | null;
  city: string | null;
  sportSlug: string;
  limit: number;
  maxNewUrls: number;
  dryRun: boolean;
  retryFailed: boolean;
  domains: string[];
  outputPath: string | null;
  statePath: string | null;
  reportOutputPath: string | null;
  scrapeStatePath: string | null;
  scrapeAfterDiscovery: boolean;
}

interface SearchWebResult {
  url: string;
  title?: string;
  description?: string;
}

interface FirecrawlSearchResponse {
  success?: boolean;
  data?: {
    web?: SearchWebResult[];
  };
}

interface FirecrawlMapResponse {
  success?: boolean;
  data?: {
    links?: Array<
      | string
      | {
          url?: string;
          title?: string;
          description?: string;
        }
    >;
  };
}

interface ScrapeStateUrlEntry {
  canonicalUrl?: string;
  lastStatus?: "discovered" | "scraped" | "no_data" | "failed";
  lastAttemptedAt?: string | null;
}

interface ScrapeStateSnapshot {
  urls?: Record<string, ScrapeStateUrlEntry>;
}

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";
const DEFAULT_LIMIT = 10;
const DEFAULT_MAX_NEW_URLS = 25;
const MIN_PRIMARY_QUALIFYING_LEADS = 3;
const SEARCH_CONCURRENCY = 2;
const SEARCH_RETRIES = 5;

class FirecrawlHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FirecrawlHttpError";
    this.status = status;
  }
}

class FirecrawlRateLimitError extends FirecrawlHttpError {
  retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(429, message);
    this.name = "FirecrawlRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseListArg(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function shouldSkipByDomain(url: string, allowedDomains: string[]) {
  if (allowedDomains.length === 0) return false;

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return !allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return true;
  }
}

function shouldSkipByRecentFailure(
  entry: ScrapeStateUrlEntry,
  retryFailed: boolean,
): boolean {
  if (entry.lastStatus !== "failed") return false;
  if (retryFailed) return false;

  const lastAttemptedAt = entry.lastAttemptedAt;
  if (!lastAttemptedAt) return true;

  const lastAttemptMs = new Date(lastAttemptedAt).getTime();
  if (!Number.isFinite(lastAttemptMs)) return true;

  const elapsedHours = (Date.now() - lastAttemptMs) / (1000 * 60 * 60);
  return elapsedHours < 24;
}

async function tryReadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await import("node:fs/promises").then((mod) =>
      mod.readFile(filePath, "utf-8"),
    );
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function firecrawlRequest<T>(
  apiKey: string,
  endpoint: string,
  init: RequestInit,
): Promise<T> {
  return pRetry(
    async () => {
      const response = await fetch(`${FIRECRAWL_BASE_URL}${endpoint}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(init.headers ?? {}),
        },
      });

      const text = await response.text();
      const parsed = text.trim().length > 0 ? JSON.parse(text) : null;

      if (!response.ok) {
        const errorMessage = `Firecrawl request failed (${response.status}) ${endpoint}: ${JSON.stringify(parsed, null, 2)}`;
        if (response.status === 429) {
          const retryAfterMessage =
            typeof parsed?.error === "string" ? parsed.error : "";
          const retryAfterMatch =
            retryAfterMessage.match(/retry after (\d+)s/i);
          const retryAfterSeconds = retryAfterMatch
            ? Number.parseInt(retryAfterMatch[1] ?? "0", 10)
            : 10;
          throw new FirecrawlRateLimitError(
            errorMessage,
            Math.max(retryAfterSeconds, 1) * 1000,
          );
        }

        throw new FirecrawlHttpError(response.status, errorMessage);
      }

      return parsed as T;
    },
    {
      retries: SEARCH_RETRIES,
      minTimeout: 1000,
      maxTimeout: 15000,
      shouldRetry: ({ error }) => {
        if (error instanceof FirecrawlRateLimitError) return true;
        if (error instanceof FirecrawlHttpError) {
          return error.status === 408 || error.status >= 500;
        }

        return true;
      },
      onFailedAttempt: async ({ error }) => {
        if (error instanceof FirecrawlRateLimitError) {
          await new Promise((resolve) =>
            setTimeout(resolve, error.retryAfterMs),
          );
        }
      },
    },
  );
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    province: null,
    city: null,
    sportSlug: "pickleball",
    limit: DEFAULT_LIMIT,
    maxNewUrls: DEFAULT_MAX_NEW_URLS,
    dryRun: false,
    retryFailed: false,
    domains: [],
    outputPath: null,
    statePath: null,
    reportOutputPath: null,
    scrapeStatePath: null,
    scrapeAfterDiscovery: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--retry-failed") {
      options.retryFailed = true;
      continue;
    }
    if (arg === "--scrape-after-discovery") {
      options.scrapeAfterDiscovery = true;
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
    if (arg === "--max-new-urls") {
      const value = args[index + 1];
      if (!value) throw new Error("--max-new-urls requires a value");
      options.maxNewUrls = parsePositiveInt(value, "--max-new-urls");
      index += 1;
      continue;
    }
    if (arg.startsWith("--max-new-urls=")) {
      options.maxNewUrls = parsePositiveInt(
        arg.replace("--max-new-urls=", ""),
        "--max-new-urls",
      );
      continue;
    }
    if (arg === "--domains") {
      const value = args[index + 1];
      if (!value) throw new Error("--domains requires a value");
      options.domains = parseListArg(value).map((entry) =>
        entry.replace(/^www\./, "").toLowerCase(),
      );
      index += 1;
      continue;
    }
    if (arg.startsWith("--domains=")) {
      options.domains = parseListArg(arg.replace("--domains=", "")).map(
        (entry) => entry.replace(/^www\./, "").toLowerCase(),
      );
      continue;
    }
    if (arg === "--output") {
      const value = args[index + 1];
      if (!value) throw new Error("--output requires a value");
      options.outputPath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.outputPath = arg.replace("--output=", "");
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
    if (arg === "--scrape-state") {
      const value = args[index + 1];
      if (!value) throw new Error("--scrape-state requires a value");
      options.scrapeStatePath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--scrape-state=")) {
      options.scrapeStatePath = arg.replace("--scrape-state=", "");
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
  if (!options.sportSlug.trim())
    throw new Error("--sport-slug cannot be empty");

  return options;
}

async function runSearch(
  apiKey: string,
  query: string,
  options: ScriptOptions,
): Promise<SearchWebResult[]> {
  const response = await firecrawlRequest<FirecrawlSearchResponse>(
    apiKey,
    "/search",
    {
      method: "POST",
      body: JSON.stringify({
        query,
        limit: options.limit,
        sources: ["web"],
        location: `${options.city}, ${options.province}, Philippines`,
        country: "PH",
        timeout: 60_000,
        ignoreInvalidURLs: true,
      }),
    },
  );

  return Array.isArray(response.data?.web) ? response.data.web : [];
}

async function runMap(
  apiKey: string,
  url: string,
  search: string,
): Promise<SearchWebResult[]> {
  const response = await firecrawlRequest<FirecrawlMapResponse>(
    apiKey,
    "/map",
    {
      method: "POST",
      body: JSON.stringify({
        url,
        search,
        limit: 50,
      }),
    },
  );

  const links = Array.isArray(response.data?.links) ? response.data.links : [];

  return links
    .map((item) => {
      if (typeof item === "string") {
        return {
          url: item,
        } satisfies SearchWebResult;
      }

      return {
        url: normalizeString(item.url),
        title: normalizeString(item.title) || undefined,
        description: normalizeString(item.description) || undefined,
      } satisfies SearchWebResult;
    })
    .filter((item) => isValidHttpUrl(item.url));
}

function buildMapSearchTerms(cityName: string): string[] {
  const trimmed = cityName.trim();
  const stripped = trimmed.replace(/\s+city$/i, "").trim();
  return Array.from(new Set([trimmed, stripped].filter(Boolean)));
}

async function main() {
  const options = parseArgs();
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }

  const scopes: ResolvedCuratedDiscoveryScope[] =
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
    const scopePaths = buildCuratedDiscoveryScopePaths({
      city: scope.citySlug,
      province: scope.provinceSlug,
      sportSlug: scope.sportSlug,
    });

    const outputPath = path.resolve(
      process.cwd(),
      options.outputPath ?? scopePaths.urlsPath,
    );
    const statePath = path.resolve(
      process.cwd(),
      options.statePath ?? scopePaths.statePath,
    );
    const reportPath = path.resolve(
      process.cwd(),
      options.reportOutputPath ?? scopePaths.reportPath,
    );
    const scrapeStatePath = path.resolve(
      process.cwd(),
      options.scrapeStatePath ?? scopePaths.scrapeStatePath,
    );

    const scopeKey = `${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}`;
    const stateRepository = new CuratedLeadDiscoveryStateRepository();
    const state = await stateRepository.load(statePath, scopeKey);
    const scrapeState =
      (await tryReadJsonFile<ScrapeStateSnapshot>(scrapeStatePath)) ?? {};
    const runAt = new Date().toISOString();

    const queryPlan = buildCuratedLeadQueryPlan({
      city: scope.cityName,
      province: scope.provinceName,
      sportSlug: scope.sportSlug,
      knownDomainQueries: buildKnownDomainQueries({
        city: scope.cityName,
        province: scope.provinceName,
        sportSlug: scope.sportSlug,
      }),
    });
    const queriesRun: string[] = [];

    const emittedUrls: string[] = [];
    const skippedAlreadyDiscovered: string[] = [];
    const skippedAlreadyScraped: string[] = [];
    const skippedLowRelevance: Array<{ url: string; score: number }> = [];
    const skippedLeadOnly: string[] = [];
    const failedQueries: Array<{ query: string; error: string }> = [];
    let primaryQualifyingLeads = 0;
    const mappedLeadCache = new Map<string, SearchWebResult[]>();

    const queryLimiter = pLimit(SEARCH_CONCURRENCY);
    const processCandidate = (
      candidateUrl: string,
      query: string,
      source: SearchWebResult,
      emitOptions?: {
        forceEmit?: boolean;
      },
    ) => {
      if (!isValidHttpUrl(candidateUrl)) return;
      if (shouldSkipByDomain(candidateUrl, options.domains)) return;

      const scoring = scoreDiscoverySearchResult(
        {
          url: candidateUrl,
          title: source.title,
          description: source.description,
        } satisfies DiscoverySearchResult,
        {
          city: scope.cityName,
          province: scope.provinceName,
          sportSlug: scope.sportSlug,
        },
      );

      const canonicalUrl = canonicalizeLeadUrl(candidateUrl);
      const existing = state.urls[canonicalUrl];
      const scrapeStateEntry = scrapeState.urls?.[canonicalUrl];

      state.urls[canonicalUrl] = {
        canonicalUrl,
        latestUrl: candidateUrl,
        firstDiscoveredAt: existing?.firstDiscoveredAt ?? runAt,
        lastDiscoveredAt: runAt,
        sourceQuery: query,
        title: source.title ?? existing?.title ?? null,
        snippet: source.description ?? existing?.snippet ?? null,
        domain: (() => {
          try {
            return new URL(candidateUrl).hostname.replace(/^www\./, "");
          } catch {
            return existing?.domain ?? null;
          }
        })(),
        relevanceScore: scoring.score,
        handedOffToScrapeAt: existing?.handedOffToScrapeAt ?? null,
      };

      if (!scoring.isLikelyVenueLead && !emitOptions?.forceEmit) {
        skippedLowRelevance.push({
          url: candidateUrl,
          score: scoring.score,
        });
        return;
      }

      primaryQualifyingLeads += 1;

      if (
        scrapeStateEntry &&
        (scrapeStateEntry.lastStatus === "scraped" ||
          scrapeStateEntry.lastStatus === "no_data" ||
          shouldSkipByRecentFailure(scrapeStateEntry, options.retryFailed))
      ) {
        skippedAlreadyScraped.push(candidateUrl);
        return;
      }

      emittedUrls.push(candidateUrl);
    };

    const processSingleQuery = async (query: string) => {
      try {
        queriesRun.push(query);
        const results = await runSearch(apiKey, query, options);
        for (const result of results) {
          const rawUrl = normalizeString(result.url);
          if (!isValidHttpUrl(rawUrl)) continue;
          const classified = classifyDiscoveryUrl(rawUrl);

          let candidates: SearchWebResult[] = [];

          if (classified.shouldMap) {
            const cacheKey = `${classified.host}:${scope.citySlug}`;
            const mappedResults =
              mappedLeadCache.get(cacheKey) ??
              (await runMap(
                apiKey,
                `https://${classified.host}`,
                `${scope.cityName} ${scope.sportSlug}`,
              ));
            mappedLeadCache.set(cacheKey, mappedResults);
            candidates =
              classified.strategy === "map_spa_directory" ? [] : mappedResults;
            if (classified.strategy === "map_spa_directory") {
              skippedLeadOnly.push(rawUrl);
              continue;
            }
          } else if (classified.shouldEmitDirectly) {
            candidates = [result];
          } else {
            skippedLeadOnly.push(rawUrl);
            continue;
          }

          for (const candidate of candidates) {
            const candidateUrl = normalizeString(candidate.url);
            const candidateStrategy = classifyDiscoveryUrl(candidateUrl);
            processCandidate(
              candidateUrl,
              query,
              {
                url: candidateUrl,
                title: candidate.title ?? result.title,
                description: candidate.description ?? result.description,
              },
              {
                forceEmit:
                  classified.strategy === "map_static_directory" &&
                  candidateStrategy.strategy === "map_static_directory" &&
                  candidateStrategy.shouldEmitDirectly,
              },
            );
          }
        }
      } catch (error) {
        failedQueries.push({
          query,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const processQueries = async (queries: string[]) => {
      await Promise.all(
        queries.map((query) => queryLimiter(() => processSingleQuery(query))),
      );
    };

    await processQueries(queryPlan.primary);

    for (const config of getDiscoveryDomainConfigsByStrategy(
      "map_static_directory",
    )) {
      for (const searchTerm of buildMapSearchTerms(scope.cityName)) {
        const hostQuery = `host-map:${config.host}:${searchTerm}`;
        queriesRun.push(hostQuery);
        try {
          const mappedResults = await runMap(
            apiKey,
            `https://${config.host}`,
            searchTerm,
          );

          for (const result of mappedResults) {
            processCandidate(normalizeString(result.url), hostQuery, result);
          }
        } catch (error) {
          failedQueries.push({
            query: hostQuery,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    for (const config of getDiscoveryDomainConfigsByStrategy(
      "map_spa_directory",
    )) {
      for (const searchTerm of buildMapSearchTerms(scope.cityName)) {
        const hostQuery = `host-map:${config.host}:${searchTerm}`;
        queriesRun.push(hostQuery);
        try {
          const mappedResults = await runMap(
            apiKey,
            `https://${config.host}`,
            searchTerm,
          );
          skippedLeadOnly.push(
            ...mappedResults.map((result) => normalizeString(result.url)),
          );
        } catch (error) {
          failedQueries.push({
            query: hostQuery,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    if (queryPlan.knownDomain.length > 0) {
      await processQueries(queryPlan.knownDomain);
    }

    if (primaryQualifyingLeads < MIN_PRIMARY_QUALIFYING_LEADS) {
      await processQueries(queryPlan.fallback);
    }

    const uniqueEmittedUrls = Array.from(
      new Set(emittedUrls.map((url) => canonicalizeLeadUrl(url))),
    )
      .map(
        (canonicalUrl) => state.urls[canonicalUrl]?.latestUrl ?? canonicalUrl,
      )
      .slice(0, options.maxNewUrls);

    state.queries = queriesRun;

    const report = {
      scope: {
        provinceName: scope.provinceName,
        provinceSlug: scope.provinceSlug,
        cityName: scope.cityName,
        citySlug: scope.citySlug,
        sportSlug: scope.sportSlug,
      },
      generatedAt: runAt,
      queries: queriesRun,
      emittedUrls: uniqueEmittedUrls,
      skippedAlreadyDiscovered,
      skippedAlreadyScraped,
      skippedLowRelevance,
      skippedLeadOnly,
      failedQueries,
      outputPath,
      statePath,
      scrapeStatePath,
    };

    console.log(`Scope: ${scope.provinceSlug} / ${scope.citySlug}`);
    console.log(`Queries run: ${queriesRun.length}`);
    console.log(`New lead URLs: ${uniqueEmittedUrls.length}`);
    console.log(`Already discovered: ${skippedAlreadyDiscovered.length}`);
    console.log(`Already scraped: ${skippedAlreadyScraped.length}`);
    console.log(`Low relevance: ${skippedLowRelevance.length}`);
    console.log(`Lead-only skipped: ${skippedLeadOnly.length}`);
    console.log(`Failed queries: ${failedQueries.length}`);

    if (!options.dryRun) {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, `${uniqueEmittedUrls.join("\n")}\n`, "utf-8");
      await writeFile(
        reportPath,
        `${JSON.stringify(report, null, 2)}\n`,
        "utf-8",
      );
      await stateRepository.save(statePath, state);
      console.log(`Wrote lead URLs to ${outputPath}`);
      console.log(`Wrote discovery report to ${reportPath}`);
      console.log(`Wrote discovery state to ${statePath}`);
    }

    if (options.scrapeAfterDiscovery && uniqueEmittedUrls.length > 0) {
      await runFirecrawlCuratedCourtsCli([
        "--start-url",
        "https://kudoscourts.com/",
        "--urls-file",
        outputPath,
        "--output",
        path.resolve(process.cwd(), scopePaths.scrapeOutputPath),
        "--raw-output",
        path.resolve(process.cwd(), scopePaths.scrapeRawOutputPath),
        "--state",
        scrapeStatePath,
        "--coverage-output",
        path.resolve(process.cwd(), scopePaths.scrapeCoverageOutputPath),
        "--skip-db-coverage",
        "--include=",
        "--trust-urls-file",
      ]);
    }
  }
}

export function runCuratedLeadDiscoveryCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, main);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedLeadDiscoveryCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
