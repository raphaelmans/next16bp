/**
 * Seed curated courts from generated CSV files.
 *
 * Usage:
 *   pnpm db:seed:curated-courts
 *   pnpm db:seed:curated-courts -- --dry-run
 *   pnpm db:seed:curated-courts -- --file scripts/output/sports360-curated-courts.normalized.csv
 *   pnpm db:seed:curated-courts -- --files scripts/output/sports360-curated-courts.normalized.csv,scripts/output/pickleheads-curated-courts.normalized.csv
 *   pnpm db:seed:curated-courts -- --continue-on-error
 *   pnpm db:seed:curated-courts -- --fail-on-missing
 */

import { access } from "node:fs/promises";
import path from "node:path";
import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../shared/cli-runtime";
import { runCuratedCourtImportCli } from "./curated-court-import.service";

interface SeedOptions {
  files: string[];
  dryRun: boolean;
  continueOnError: boolean;
  failOnMissing: boolean;
}

const DEFAULT_FILES = [
  "scripts/output/sports360-curated-courts.normalized.csv",
  "scripts/output/pickleheads-curated-courts.normalized.csv",
];

function parseListArg(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    files: [],
    dryRun: false,
    continueOnError: false,
    failOnMissing: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--continue-on-error") {
      options.continueOnError = true;
      continue;
    }

    if (arg === "--fail-on-missing") {
      options.failOnMissing = true;
      continue;
    }

    if (arg === "--file") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--file requires a path value");
      }
      options.files.push(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--file=")) {
      options.files.push(arg.replace("--file=", ""));
      continue;
    }

    if (arg === "--files") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--files requires a comma-separated value");
      }
      options.files.push(...parseListArg(value));
      index += 1;
      continue;
    }

    if (arg.startsWith("--files=")) {
      options.files.push(...parseListArg(arg.replace("--files=", "")));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const selectedFiles =
    options.files.length > 0 ? options.files : DEFAULT_FILES;
  const uniqueFiles = Array.from(
    new Set(selectedFiles.map((file) => file.trim())),
  );
  options.files = uniqueFiles.filter((file) => file.length > 0);

  if (options.files.length === 0) {
    throw new Error("No CSV files provided");
  }

  return options;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runImportForFile(
  filePath: string,
  options: SeedOptions,
): Promise<void> {
  const args = ["--file", filePath];

  if (options.dryRun) {
    args.push("--dry-run");
  }

  if (options.continueOnError) {
    args.push("--continue-on-error");
  }

  await runCuratedCourtImportCli(args);
}

async function seedCuratedCourts() {
  const options = parseArgs();
  const resolvedFiles = options.files.map((filePath) =>
    path.resolve(process.cwd(), filePath),
  );

  console.log("Starting curated courts seed...\n");
  console.log(`Mode: ${options.dryRun ? "dry run" : "live import"}`);
  console.log(`Continue on error: ${options.continueOnError ? "yes" : "no"}`);
  console.log(
    `Fail on missing file: ${options.failOnMissing ? "yes" : "no"}\n`,
  );

  let filesProcessed = 0;
  let filesSucceeded = 0;
  let filesFailed = 0;
  let filesMissing = 0;

  for (const filePath of resolvedFiles) {
    const exists = await fileExists(filePath);
    if (!exists) {
      filesMissing += 1;
      const message = `CSV file not found: ${filePath}`;
      if (options.failOnMissing) {
        throw new Error(message);
      }
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }

    filesProcessed += 1;
    console.log(`\n=== Importing ${filePath} ===\n`);

    try {
      await runImportForFile(filePath, options);
      filesSucceeded += 1;
    } catch (error) {
      filesFailed += 1;
      console.error(error);

      if (!options.continueOnError) {
        throw error;
      }
    }
  }

  console.log("\n--- Seed Summary ---");
  console.log(`Files requested: ${resolvedFiles.length}`);
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Files succeeded: ${filesSucceeded}`);
  console.log(`Files failed: ${filesFailed}`);
  console.log(`Files missing: ${filesMissing}`);

  if (filesFailed > 0) {
    throw new Error("Seed completed with failures");
  }

  console.log("\nCurated court seed completed successfully!");
}

export function runCuratedCourtSeedCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, seedCuratedCourts);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedCourtSeedCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
