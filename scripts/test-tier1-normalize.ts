/**
 * Tier 1 — Whitebox edge case tests.
 * Deterministic (--no-ai --mapping-file). No API key needed.
 *
 * Run: pnpm script:test-tier1
 */
import path from "node:path";
import {
  compareStrict,
  discoverFixtures,
  printSummary,
  runNormalize,
  type TestResult,
} from "./test-normalize-harness";

const TIER_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/normalize-data/tier1",
);

const main = () => {
  const fixtures = discoverFixtures(TIER_DIR, { includePromoted: true });

  if (fixtures.length === 0) {
    process.stderr.write(
      "No tier1 fixtures found. Run pnpm script:gen-tier-fixtures first.\n",
    );
    process.exit(1);
  }

  const results: TestResult[] = [];

  for (const fixture of fixtures) {
    const args = [
      `--format=${fixture.format}`,
      `--path=${fixture.inputPath}`,
      "--no-ai",
    ];

    if (fixture.mappingPath) {
      args.push(`--mapping-file=${fixture.mappingPath}`);
    }

    if (fixture.extraArgs) {
      args.push(...fixture.extraArgs);
    }

    try {
      const output = runNormalize(args);
      const result = compareStrict(output, fixture.expected);

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

  printSummary("TIER 1 (Whitebox Edge Cases)", results);
};

main();
