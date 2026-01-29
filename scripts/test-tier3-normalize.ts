/**
 * Tier 3 — Blackbox human-readable tests.
 * Uses AI (no --no-ai, no --mapping-file). Requires OPENAI_API_KEY.
 * On failure, saves actual output for debugging/promotion.
 *
 * Run: pnpm script:test-tier3
 */
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  compareRelaxed,
  discoverFixtures,
  printSummary,
  runNormalize,
  type TestResult,
} from "./test-normalize-harness";

const TIER_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/normalize-data/tier3",
);

const main = () => {
  const fixtures = discoverFixtures(TIER_DIR);

  if (fixtures.length === 0) {
    process.stdout.write(
      "No tier3 fixtures found. Tier 3 requires hand-crafted blackbox fixtures.\n",
    );
    process.stdout.write("Skipping tier3 tests.\n");
    return;
  }

  const results: TestResult[] = [];

  for (const fixture of fixtures) {
    // Tier 3: NO --no-ai, NO --mapping-file — AI must figure it out
    const mappingPath = path.join(
      TIER_DIR,
      `${fixture.name}-actual-mapping.json`,
    );
    const args = [
      `--format=${fixture.format}`,
      `--path=${fixture.inputPath}`,
      `--save-mapping-file=${mappingPath}`,
    ];

    if (fixture.extraArgs) {
      args.push(...fixture.extraArgs);
    }

    try {
      const output = runNormalize(args);
      const result = compareRelaxed(output, fixture.expected, {
        timeToleranceMinutes: 5,
      });

      // Save actual output for debugging
      if (!result.pass) {
        writeFileSync(
          path.join(TIER_DIR, `${fixture.name}-actual-output.json`),
          JSON.stringify(output, null, 2),
          "utf-8",
        );
      } else if (existsSync(mappingPath)) {
        unlinkSync(mappingPath);
      }

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

  printSummary("TIER 3 (Blackbox Human-Readable)", results);
};

main();
