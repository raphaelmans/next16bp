import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PlaceListingVerifierService } from "@/lib/modules/automations/listing-verifier/services/place-listing-verifier.service";
import { PlaceListingFixtureSchema } from "@/lib/modules/automations/listing-verifier/shared/place-listing-verifier.schemas";

interface EvalOptions {
  model: string;
  fixtureDir: string;
  fixtureName: string | null;
  outputDir: string;
}

const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_FIXTURE_DIR = "scripts/fixtures/listing-verifier";
const DEFAULT_OUTPUT_DIR = "scripts/output/listing-verifier/evals";

function parseArgs(): EvalOptions {
  const args = process.argv.slice(2);
  const options: EvalOptions = {
    model: DEFAULT_MODEL,
    fixtureDir: DEFAULT_FIXTURE_DIR,
    fixtureName: null,
    outputDir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--model") {
      const value = args[index + 1];
      if (!value) throw new Error("--model requires a value");
      options.model = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--model=")) {
      options.model = arg.replace("--model=", "");
      continue;
    }

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

async function loadFixtures(options: EvalOptions) {
  const fixtureDir = path.resolve(process.cwd(), options.fixtureDir);
  const entries = await readdir(fixtureDir);
  const targetFiles = entries
    .filter((entry) => entry.endsWith(".json"))
    .filter((entry) => !options.fixtureName || entry === options.fixtureName)
    .sort();

  const fixtures = [];
  for (const entry of targetFiles) {
    const raw = await readFile(path.join(fixtureDir, entry), "utf-8");
    fixtures.push({
      fileName: entry,
      fixture: PlaceListingFixtureSchema.parse(JSON.parse(raw)),
    });
  }

  return fixtures;
}

async function main() {
  const options = parseArgs();
  const fixtures = await loadFixtures(options);
  const verifier = new PlaceListingVerifierService();

  const results = [];

  for (const { fileName, fixture } of fixtures) {
    const actual = await verifier.verifyBatch(
      fixture.cases.map((item) => item.evidence),
      { model: options.model },
    );

    const mismatches = fixture.cases.flatMap((item, index) => {
      const decision = actual[index];
      if (!decision) {
        return [
          `${fixture.fixtureName}:${item.evidence.placeId}: missing decision`,
        ];
      }

      const errors: string[] = [];
      if (decision.label !== item.expected.label) {
        errors.push(
          `${fixture.fixtureName}:${item.evidence.placeId}: expected label ${item.expected.label}, got ${decision.label}`,
        );
      }
      if (decision.reasonCode !== item.expected.reasonCode) {
        errors.push(
          `${fixture.fixtureName}:${item.evidence.placeId}: expected reason ${item.expected.reasonCode}, got ${decision.reasonCode}`,
        );
      }
      return errors;
    });

    results.push({
      fileName,
      fixtureName: fixture.fixtureName,
      caseCount: fixture.cases.length,
      mismatchCount: mismatches.length,
      mismatches,
      actual,
    });
  }

  const resolvedOutputDir = path.resolve(process.cwd(), options.outputDir);
  await mkdir(resolvedOutputDir, { recursive: true });
  const outputPath = path.join(resolvedOutputDir, "latest-eval-report.json");
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: options.model,
        fixtureCount: results.length,
        totalMismatches: results.reduce(
          (total, item) => total + item.mismatchCount,
          0,
        ),
        results,
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  const mismatchCount = results.reduce(
    (total, item) => total + item.mismatchCount,
    0,
  );
  console.info(
    `Evaluated ${results.length} fixture files with ${mismatchCount} mismatches.`,
  );
  console.info(`Wrote eval report to ${outputPath}`);

  if (mismatchCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
