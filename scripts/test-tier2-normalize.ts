/**
 * Tier 2 — Whitebox screenshot path tests.
 * Uses pre-extracted JSON (--extracted-file --no-ai). No API key needed.
 * Screenshot fixtures are created manually.
 *
 * Run: pnpm script:test-tier2
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  compareRelaxed,
  type ExpectedOutput,
  ExpectedOutputSchema,
  printSummary,
  runNormalize,
  type TestResult,
} from "./test-normalize-harness";

const TIER_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/normalize-data/tier2",
);

interface Tier2Fixture {
  name: string;
  imagePath: string;
  extractedPath: string;
  expectedPath: string;
  expected: ExpectedOutput;
}

const discoverTier2Fixtures = (): Tier2Fixture[] => {
  let files: string[];
  try {
    files = readdirSync(TIER_DIR);
  } catch {
    return [];
  }

  const expectedFiles = files.filter((f) => f.endsWith("-expected.json"));
  const fixtures: Tier2Fixture[] = [];

  for (const expectedFile of expectedFiles) {
    const baseName = expectedFile.replace("-expected.json", "");
    const expectedPath = path.join(TIER_DIR, expectedFile);
    const expected = ExpectedOutputSchema.parse(
      JSON.parse(readFileSync(expectedPath, "utf-8")),
    );

    // Find image file
    const imageExts = [".jpeg", ".jpg", ".png"];
    const imageFile = imageExts
      .map((ext) => `${baseName}${ext}`)
      .find((f) => files.includes(f));

    if (!imageFile) {
      process.stderr.write(
        `WARN: No image file found for tier2 fixture "${baseName}"\n`,
      );
      continue;
    }

    // Find extracted JSON
    const extractedFile = `${baseName}-extracted.json`;
    if (!files.includes(extractedFile)) {
      process.stderr.write(
        `WARN: No extracted file found for tier2 fixture "${baseName}"\n`,
      );
      continue;
    }

    fixtures.push({
      name: baseName,
      imagePath: path.join(TIER_DIR, imageFile),
      extractedPath: path.join(TIER_DIR, extractedFile),
      expectedPath,
      expected,
    });
  }

  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
};

const main = () => {
  const fixtures = discoverTier2Fixtures();

  if (fixtures.length === 0) {
    process.stdout.write(
      "No tier2 fixtures found. Tier 2 requires manually created screenshot fixtures.\n",
    );
    process.stdout.write("Skipping tier2 tests.\n");
    return;
  }

  const results: TestResult[] = [];

  for (const fixture of fixtures) {
    const args = [
      "--format=image",
      `--path=${fixture.imagePath}`,
      `--extracted-file=${fixture.extractedPath}`,
      "--no-ai",
    ];

    try {
      const output = runNormalize(args);
      const result = compareRelaxed(output, fixture.expected, {
        timeToleranceMinutes: 5,
      });

      results.push({
        name: fixture.name,
        pass: result.pass,
        blockCount: output.blocks.length,
        errorCount: output.errors.length,
        mismatches: result.mismatches,
      });
    } catch (err) {
      results.push({
        name: fixture.name,
        pass: false,
        blockCount: 0,
        errorCount: 0,
        mismatches: [err instanceof Error ? err.message : "Unknown error"],
      });
    }
  }

  printSummary("TIER 2 (Screenshot Path)", results);
};

main();
