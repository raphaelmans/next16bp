/**
 * Discover individual Facebook page/profile leads for curated ingestion.
 *
 * Discovery only. This does not scrape Facebook details.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CuratedLeadDiscoveryStateRepository } from "../repositories/curated-lead-discovery-state.repository";
import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../shared/cli-runtime";
import {
  resolveCuratedDiscoveryScopeOrThrow,
  resolveDefaultCuratedDiscoveryScopes,
  type ResolvedCuratedDiscoveryScope,
} from "../shared/curated-discovery-scopes";
import { buildFacebookPageLeadQueries } from "../shared/facebook-query-builder";
import {
  scoreFacebookPageLead,
  type FacebookLeadResult,
} from "../shared/facebook-page-scoring";
import { canonicalizeLeadUrl, normalizeLocationSlug } from "../shared/url-normalization";

interface ScriptOptions {
  province: string | null;
  city: string | null;
  sportSlug: string;
  limit: number;
  targetCount: number;
  dryRun: boolean;
  outputPath: string | null;
  statePath: string | null;
  reportOutputPath: string | null;
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

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";
const DEFAULT_LIMIT = 10;
const DEFAULT_TARGET_COUNT = 10;

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function buildFacebookScopePaths(scope: ResolvedCuratedDiscoveryScope) {
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
    statePath: path.join(baseDir, "facebook-pages.state.json"),
    reportPath: path.join(baseDir, "facebook-pages.report.json"),
  };
}

async function firecrawlRequest<T>(
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
  const parsed = text.trim().length > 0 ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `Firecrawl request failed (${response.status}) ${endpoint}: ${JSON.stringify(parsed, null, 2)}`,
    );
  }

  return parsed as T;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    province: null,
    city: null,
    sportSlug: "pickleball",
    limit: DEFAULT_LIMIT,
    targetCount: DEFAULT_TARGET_COUNT,
    dryRun: false,
    outputPath: null,
    statePath: null,
    reportOutputPath: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
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
    if (arg === "--target-count") {
      const value = args[index + 1];
      if (!value) throw new Error("--target-count requires a value");
      options.targetCount = parsePositiveInt(value, "--target-count");
      index += 1;
      continue;
    }
    if (arg.startsWith("--target-count=")) {
      options.targetCount = parsePositiveInt(
        arg.replace("--target-count=", ""),
        "--target-count",
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
        country: "PH",
        timeout: 60_000,
        ignoreInvalidURLs: true,
      }),
    },
  );

  return Array.isArray(response.data?.web) ? response.data.web : [];
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
    const scopePaths = buildFacebookScopePaths(scope);
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
    const scopeKey = `facebook:${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}`;
    const stateRepository = new CuratedLeadDiscoveryStateRepository();
    const state = await stateRepository.load(statePath, scopeKey);
    const runAt = new Date().toISOString();

    const queries = buildFacebookPageLeadQueries({
      city: scope.cityName,
      province: scope.provinceName,
      sportSlug: scope.sportSlug,
    });

    const emittedUrls: string[] = [];
    const skippedAlreadyDiscovered: string[] = [];
    const skippedLowRelevance: Array<{ url: string; score: number }> = [];

    for (const query of queries) {
      const results = await runSearch(apiKey, query, options);
      for (const result of results) {
        const rawUrl = normalizeString(result.url);
        if (!isValidHttpUrl(rawUrl)) continue;

        const scoring = scoreFacebookPageLead(
          {
            url: rawUrl,
            title: result.title,
            description: result.description,
          } satisfies FacebookLeadResult,
          {
            city: scope.cityName,
            province: scope.provinceName,
            sportSlug: scope.sportSlug,
          },
        );

        const canonicalUrl = canonicalizeLeadUrl(rawUrl);
        const existing = state.urls[canonicalUrl];

        state.urls[canonicalUrl] = {
          canonicalUrl,
          latestUrl: rawUrl,
          firstDiscoveredAt: existing?.firstDiscoveredAt ?? runAt,
          lastDiscoveredAt: runAt,
          sourceQuery: query,
          title: result.title ?? existing?.title ?? null,
          snippet: result.description ?? existing?.snippet ?? null,
          domain: "facebook.com",
          relevanceScore: scoring.score,
          handedOffToScrapeAt: existing?.handedOffToScrapeAt ?? null,
        };

        if (!scoring.isLikelyPageLead) {
          skippedLowRelevance.push({ url: rawUrl, score: scoring.score });
          continue;
        }

        if (existing?.handedOffToScrapeAt) {
          skippedAlreadyDiscovered.push(rawUrl);
          continue;
        }

        emittedUrls.push(rawUrl);
      }
    }

    const uniqueEmittedUrls = Array.from(
      new Set(emittedUrls.map((url) => canonicalizeLeadUrl(url))),
    )
      .map(
        (canonicalUrl) => state.urls[canonicalUrl]?.latestUrl ?? canonicalUrl,
      )
      .slice(0, options.targetCount);

    for (const url of uniqueEmittedUrls) {
      const entry = state.urls[canonicalizeLeadUrl(url)];
      if (entry) {
        entry.handedOffToScrapeAt = runAt;
      }
    }

    state.queries = queries;

    const report = {
      scope: {
        provinceName: scope.provinceName,
        provinceSlug: scope.provinceSlug,
        cityName: scope.cityName,
        citySlug: scope.citySlug,
        sportSlug: scope.sportSlug,
      },
      generatedAt: runAt,
      queries,
      emittedUrls: uniqueEmittedUrls,
      skippedAlreadyDiscovered,
      skippedLowRelevance,
      outputPath,
      statePath,
    };

    console.log(`Facebook scope: ${scope.provinceSlug} / ${scope.citySlug}`);
    console.log(`Queries run: ${queries.length}`);
    console.log(`Qualified Facebook pages: ${uniqueEmittedUrls.length}`);
    console.log(`Already discovered: ${skippedAlreadyDiscovered.length}`);
    console.log(`Low relevance: ${skippedLowRelevance.length}`);

    if (!options.dryRun) {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, `${uniqueEmittedUrls.join("\n")}\n`, "utf-8");
      await writeFile(
        reportPath,
        `${JSON.stringify(report, null, 2)}\n`,
        "utf-8",
      );
      await stateRepository.save(statePath, state);
      console.log(`Wrote Facebook lead URLs to ${outputPath}`);
      console.log(`Wrote Facebook discovery report to ${reportPath}`);
      console.log(`Wrote Facebook discovery state to ${statePath}`);
    }
  }
}

export function runCuratedFacebookPageDiscoveryCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, main);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedFacebookPageDiscoveryCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
