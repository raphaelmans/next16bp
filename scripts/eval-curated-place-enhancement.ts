import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { replayCuratedEnhancementFromFacebookCapture } from "@/lib/modules/automations/curated-ingestion/services/curated-facebook-page-capture.service";
import type { CuratedPlaceEnhancementJudgement } from "@/lib/modules/automations/curated-ingestion/services/curated-place-enhancement.service";
import { OpenAiCuratedPlaceEnhancementJudge } from "@/lib/modules/automations/curated-ingestion/services/curated-place-enhancement-judge.service";
import { buildCuratedEnhancementFromWebsiteExtract } from "@/lib/modules/automations/curated-ingestion/services/firecrawl-curated-courts.service";
import {
  CuratedPlaceEnhancementEvalReportSchema,
  type CuratedPlaceEnhancementFixture,
  CuratedPlaceEnhancementFixtureSchema,
} from "@/lib/modules/automations/curated-ingestion/shared/curated-place-enhancement.schemas";

interface EvalOptions {
  fixtureDir: string;
  fixtureName: string | null;
  source: "website" | "facebook" | "all";
  judgeModel: string;
  facebookModel: string;
  outputDir: string;
}

const DEFAULT_FIXTURE_DIR = "scripts/fixtures/curated-place-enhancement";
const DEFAULT_OUTPUT_DIR = "scripts/output/curated-enhancement/evals";
const DEFAULT_JUDGE_MODEL = "gpt-5-mini";
const DEFAULT_FACEBOOK_MODEL = "gpt-5-mini";

function parseArgs(): EvalOptions {
  const args = process.argv.slice(2);
  const options: EvalOptions = {
    fixtureDir: DEFAULT_FIXTURE_DIR,
    fixtureName: null,
    source: "all",
    judgeModel: DEFAULT_JUDGE_MODEL,
    facebookModel: DEFAULT_FACEBOOK_MODEL,
    outputDir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--fixture-dir") {
      const value = args[index + 1];
      if (!value) throw new Error("--fixture-dir requires a value");
      options.fixtureDir = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--fixture-dir=")) {
      options.fixtureDir = arg.replace("--fixture-dir=", "");
      continue;
    }
    if (arg === "--fixture") {
      const value = args[index + 1];
      if (!value) throw new Error("--fixture requires a value");
      options.fixtureName = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--fixture=")) {
      options.fixtureName = arg.replace("--fixture=", "");
      continue;
    }
    if (arg === "--source") {
      const value = args[index + 1];
      if (!value) throw new Error("--source requires a value");
      if (value !== "website" && value !== "facebook" && value !== "all") {
        throw new Error("--source must be one of: website, facebook, all");
      }
      options.source = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--source=")) {
      const value = arg.replace("--source=", "");
      if (value !== "website" && value !== "facebook" && value !== "all") {
        throw new Error("--source must be one of: website, facebook, all");
      }
      options.source = value;
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
    if (arg === "--output-dir") {
      const value = args[index + 1];
      if (!value) throw new Error("--output-dir requires a value");
      options.outputDir = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      options.outputDir = arg.replace("--output-dir=", "");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function loadFixtures(
  options: EvalOptions,
): Promise<CuratedPlaceEnhancementFixture[]> {
  const fixtureDir = path.resolve(process.cwd(), options.fixtureDir);
  const entries = await readdir(fixtureDir);
  const targetFiles = entries
    .filter((entry) => entry.endsWith(".json"))
    .filter((entry) => !options.fixtureName || entry === options.fixtureName)
    .sort();

  const fixtures: CuratedPlaceEnhancementFixture[] = [];
  for (const entry of targetFiles) {
    const raw = await readFile(path.join(fixtureDir, entry), "utf-8");
    const fixture = CuratedPlaceEnhancementFixtureSchema.parse(JSON.parse(raw));
    if (options.source !== "all" && fixture.source !== options.source) {
      continue;
    }
    fixtures.push(fixture);
  }

  return fixtures;
}

function normalizePayloadForComparison(
  payload: CuratedPlaceEnhancementFixture["expected"]["improvedPayload"],
) {
  return {
    ...payload,
    amenities: [...payload.amenities].sort(),
    photoUrls: [...payload.photoUrls].sort(),
  };
}

function compareExpectedPayload(
  actual: CuratedPlaceEnhancementFixture["expected"]["improvedPayload"],
  expected: CuratedPlaceEnhancementFixture["expected"]["improvedPayload"],
) {
  const normalizedActual = normalizePayloadForComparison(actual);
  const normalizedExpected = normalizePayloadForComparison(expected);
  const mismatches: string[] = [];

  const keys = Object.keys(normalizedExpected) as Array<
    keyof typeof normalizedExpected
  >;
  for (const key of keys) {
    if (
      JSON.stringify(normalizedActual[key]) !==
      JSON.stringify(normalizedExpected[key])
    ) {
      mismatches.push(
        `payload.${String(key)} expected ${JSON.stringify(normalizedExpected[key])}, got ${JSON.stringify(normalizedActual[key])}`,
      );
    }
  }

  return mismatches;
}

async function main() {
  const options = parseArgs();
  const fixtures = await loadFixtures(options);
  const judge = new OpenAiCuratedPlaceEnhancementJudge(options.judgeModel);

  const results: Array<{
    fixtureName: string;
    source: "website" | "facebook";
    matched: boolean;
    mismatches: string[];
    actual: CuratedPlaceEnhancementJudgement | null;
  }> = [];

  for (const fixture of fixtures) {
    let actual: CuratedPlaceEnhancementJudgement | null = null;
    const mismatches: string[] = [];

    const extraction =
      fixture.source === "website"
        ? buildCuratedEnhancementFromWebsiteExtract({
            requestUrl: fixture.input.requestUrl,
            sportSlug: fixture.input.sportSlug,
            sourceUrl: fixture.input.sourceUrl,
            extractItem: fixture.input.extractItem,
          })
        : await replayCuratedEnhancementFromFacebookCapture({
            url: fixture.input.requestUrl,
            city: fixture.input.city,
            province: fixture.input.province,
            sportSlug: fixture.input.sportSlug,
            model: options.facebookModel,
            payload: fixture.input.capturedPage,
          });

    if (!extraction) {
      mismatches.push("extraction returned null");
    } else {
      actual = await judge.judge({
        candidate: fixture.candidate,
        extraction,
      });

      if (actual.decision !== fixture.expected.decision) {
        mismatches.push(
          `decision expected ${fixture.expected.decision}, got ${actual.decision}`,
        );
      }
      mismatches.push(
        ...compareExpectedPayload(
          actual.improvedPayload,
          fixture.expected.improvedPayload,
        ),
      );
    }

    results.push({
      fixtureName: fixture.fixtureName,
      source: fixture.source,
      matched: mismatches.length === 0,
      mismatches,
      actual,
    });
  }

  const report = CuratedPlaceEnhancementEvalReportSchema.parse({
    generatedAt: new Date().toISOString(),
    judgeModel: options.judgeModel,
    facebookModel: options.facebookModel,
    fixtureCount: results.length,
    mismatchCount: results.reduce(
      (total, item) => total + item.mismatches.length,
      0,
    ),
    results,
  });

  const outputDir = path.resolve(process.cwd(), options.outputDir);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "latest-eval-report.json");
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

  console.info(
    `Evaluated ${report.fixtureCount} fixtures with ${report.mismatchCount} mismatches.`,
  );
  console.info(`Wrote eval report to ${outputPath}`);

  if (report.mismatchCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
