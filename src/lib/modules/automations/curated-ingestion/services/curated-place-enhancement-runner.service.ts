import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/shared/infra/db/schema";
import type { DbClient } from "@/lib/shared/infra/db/types";
import { DbCuratedPlaceEnhancementRepository } from "../repositories/curated-place-enhancement.repository";
import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../shared/cli-runtime";
import { extractCuratedEnhancementFromFacebook } from "./curated-facebook-page-capture.service";
import {
  type CuratedPlaceEnhancementRepository,
  CuratedPlaceEnhancementService,
  type CuratedPlaceEnhancementSourceMode,
} from "./curated-place-enhancement.service";
import { OpenAiCuratedPlaceEnhancementJudge } from "./curated-place-enhancement-judge.service";
import { extractCuratedEnhancementFromWebsite } from "./firecrawl-curated-courts.service";
import { runPlaceEmbeddingBackfillCli } from "./place-embedding-backfill.service";

interface ScriptOptions {
  placeIds: string[] | null;
  limit: number | null;
  sourceMode: CuratedPlaceEnhancementSourceMode;
  retryFailed: boolean;
  retryReviewRequired: boolean;
  force: boolean;
  dryRun: boolean;
  facebookModel: string | null;
  judgeModel: string | null;
}

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    placeIds: null,
    limit: null,
    sourceMode: "auto",
    retryFailed: false,
    retryReviewRequired: false,
    force: false,
    dryRun: false,
    facebookModel: null,
    judgeModel: null,
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
    if (arg === "--retry-review-required") {
      options.retryReviewRequired = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--place-ids") {
      const value = args[index + 1];
      if (!value) throw new Error("--place-ids requires a value");
      options.placeIds = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      index += 1;
      continue;
    }
    if (arg.startsWith("--place-ids=")) {
      options.placeIds = arg
        .replace("--place-ids=", "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
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
    if (arg === "--source") {
      const value = args[index + 1];
      if (!value) throw new Error("--source requires a value");
      if (value !== "auto" && value !== "website" && value !== "facebook") {
        throw new Error("--source must be one of: auto, website, facebook");
      }
      options.sourceMode = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--source=")) {
      const value = arg.replace("--source=", "");
      if (value !== "auto" && value !== "website" && value !== "facebook") {
        throw new Error("--source must be one of: auto, website, facebook");
      }
      options.sourceMode = value;
      continue;
    }
    if (arg === "--facebook-model") {
      const value = args[index + 1];
      if (!value) throw new Error("--facebook-model requires a value");
      options.facebookModel = value.trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--facebook-model=")) {
      options.facebookModel = arg.replace("--facebook-model=", "").trim();
      continue;
    }
    if (arg === "--judge-model") {
      const value = args[index + 1];
      if (!value) throw new Error("--judge-model requires a value");
      options.judgeModel = value.trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--judge-model=")) {
      options.judgeModel = arg.replace("--judge-model=", "").trim();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function createDryRunRepository(
  repository: CuratedPlaceEnhancementRepository,
): CuratedPlaceEnhancementRepository {
  return {
    findCandidatesByIds: repository.findCandidatesByIds.bind(repository),
    listEligibleCandidates: repository.listEligibleCandidates.bind(repository),
    persistOutcome: async (input) => ({
      changed: input.mergedRecord?.hasChanges ?? false,
    }),
  };
}

export function makeCuratedPlaceEnhancementService(
  db: DbClient,
  options: {
    dryRun?: boolean;
    facebookModel?: string | null;
    judgeModel?: string | null;
  } = {},
) {
  const repository = new DbCuratedPlaceEnhancementRepository(db);
  const providers = {
    enhanceFromWebsite: ({
      sportSlug,
      url,
    }: {
      placeId: string;
      sportSlug: string;
      url: string;
    }) =>
      extractCuratedEnhancementFromWebsite({
        url,
        sportSlug,
      }),
    enhanceFromFacebook: ({
      city,
      province,
      sportSlug,
      url,
    }: {
      placeId: string;
      city: string;
      province: string;
      sportSlug: string;
      url: string;
    }) =>
      extractCuratedEnhancementFromFacebook({
        city,
        model: options.facebookModel ?? undefined,
        province,
        sportSlug,
        url,
      }),
  };
  const judge = new OpenAiCuratedPlaceEnhancementJudge(
    options.judgeModel ?? undefined,
  );

  return new CuratedPlaceEnhancementService(
    options.dryRun ? createDryRunRepository(repository) : repository,
    providers,
    judge,
  );
}

async function writeBatchArtifacts(input: {
  summary: Record<string, unknown>;
  reviews: unknown[];
}) {
  const outputDir = path.join(
    "scripts",
    "output",
    "curated-enhancement",
    "batch-runs",
  );
  await mkdir(outputDir, { recursive: true });
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll("-", "")
    .replace(/\.\d{3}Z$/, "Z");
  const summaryPath = path.join(outputDir, `${timestamp}.summary.json`);
  await writeFile(
    summaryPath,
    `${JSON.stringify(input.summary, null, 2)}\n`,
    "utf-8",
  );

  let reviewPath: string | null = null;
  if (input.reviews.length > 0) {
    reviewPath = path.join(outputDir, `${timestamp}.reviews.json`);
    await writeFile(
      reviewPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          count: input.reviews.length,
          items: input.reviews,
        },
        null,
        2,
      )}\n`,
      "utf-8",
    );
  }

  return {
    summaryPath,
    reviewPath,
  };
}

async function runCli() {
  const options = parseArgs();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    const service = makeCuratedPlaceEnhancementService(db, {
      dryRun: options.dryRun,
      facebookModel: options.facebookModel,
      judgeModel: options.judgeModel,
    });
    const result = options.placeIds
      ? await service.enhancePlacesByIds(options.placeIds, {
          sourceMode: options.sourceMode,
          retryFailed: options.retryFailed,
          retryReviewRequired: options.retryReviewRequired,
          force: options.force,
        })
      : await service.enhanceEligiblePlaces({
          limit: options.limit,
          sourceMode: options.sourceMode,
          retryFailed: options.retryFailed,
          retryReviewRequired: options.retryReviewRequired,
          force: options.force,
        });

    if (!options.dryRun && result.changedPlaceIds.length > 0) {
      await runPlaceEmbeddingBackfillCli([
        "--place-ids",
        result.changedPlaceIds.join(","),
      ]);
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      dryRun: options.dryRun,
      sourceMode: options.sourceMode,
      processedCount: result.processedPlaceIds.length,
      changedCount: result.changedPlaceIds.length,
      skippedCount: result.skippedPlaceIds.length,
      reviewedCount: result.reviewedPlaceIds.length,
      facebookModel: options.facebookModel,
      judgeModel: options.judgeModel,
      processedPlaceIds: result.processedPlaceIds,
      changedPlaceIds: result.changedPlaceIds,
      skippedPlaceIds: result.skippedPlaceIds,
      reviewedPlaceIds: result.reviewedPlaceIds,
    };

    const artifactPaths = await writeBatchArtifacts({
      summary,
      reviews: result.reviews,
    });
    console.log(`Processed places: ${summary.processedCount}`);
    console.log(`Changed places: ${summary.changedCount}`);
    console.log(`Skipped places: ${summary.skippedCount}`);
    console.log(`Reviewed places: ${summary.reviewedCount}`);
    console.log(`Summary written to: ${artifactPaths.summaryPath}`);
    if (artifactPaths.reviewPath) {
      console.log(`Review artifact written to: ${artifactPaths.reviewPath}`);
    }
  } finally {
    await client.end();
  }
}

export function runCuratedPlaceEnhancementCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, runCli);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedPlaceEnhancementCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
