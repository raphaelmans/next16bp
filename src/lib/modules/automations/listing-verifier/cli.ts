import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../curated-ingestion/shared/cli-runtime";
import { makeRunPlaceListingVerifierUseCase } from "./factories/place-listing-verifier.factory";

interface ScriptOptions {
  model: string;
  batchSize: number;
  limit: number | null;
  envLabel: string;
  outputDir: string;
  placeTypeFilter: "all" | "curated" | "org";
}

const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_OUTPUT_DIR = "scripts/output/listing-verifier";

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
    model: DEFAULT_MODEL,
    batchSize: DEFAULT_BATCH_SIZE,
    limit: null,
    envLabel: "local",
    outputDir: DEFAULT_OUTPUT_DIR,
    placeTypeFilter: "all",
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

    if (arg === "--batch-size") {
      const value = args[index + 1];
      if (!value) throw new Error("--batch-size requires a value");
      options.batchSize = parsePositiveInt(value, "--batch-size");
      index += 1;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = parsePositiveInt(
        arg.replace("--batch-size=", ""),
        "--batch-size",
      );
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

    if (arg === "--env-label") {
      const value = args[index + 1];
      if (!value) throw new Error("--env-label requires a value");
      options.envLabel = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--env-label=")) {
      options.envLabel = arg.replace("--env-label=", "");
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

    if (arg === "--place-type") {
      const value = args[index + 1];
      if (!value) throw new Error("--place-type requires a value");
      if (value !== "all" && value !== "curated" && value !== "org") {
        throw new Error("--place-type must be one of: all, curated, org");
      }
      options.placeTypeFilter = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--place-type=")) {
      const value = arg.replace("--place-type=", "");
      if (value !== "all" && value !== "curated" && value !== "org") {
        throw new Error("--place-type must be one of: all, curated, org");
      }
      options.placeTypeFilter = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const { useCase, close } = makeRunPlaceListingVerifierUseCase();

  try {
    const report = await useCase.execute(options);
    console.info(
      `Verified ${report.totalPlaces} place listings for ${options.envLabel}.`,
    );
    console.info(
      `Wrote report to ${options.outputDir}/${options.envLabel}/latest-summary.json`,
    );
  } finally {
    await close();
  }
}

export function runPlaceListingVerifierCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, main);
}

if (isDirectExecution(import.meta.url)) {
  runPlaceListingVerifierCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
