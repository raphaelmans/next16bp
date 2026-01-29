import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const TIER3_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/normalize-data/tier3",
);
const PROMOTED_DIR = path.resolve(
  process.cwd(),
  "scripts/fixtures/normalize-data/tier1/promoted",
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  let caseName: string | null = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (arg.startsWith("--case=")) {
      caseName = arg.replace("--case=", "");
      continue;
    }
    if (arg === "--case" && args[i + 1]) {
      caseName = args[i + 1];
      i += 1;
    }
  }

  if (!caseName) {
    throw new Error("Usage: tsx scripts/promote-tier3.ts --case=<name>");
  }

  return { caseName };
};

const findInputFile = (baseName: string) => {
  const extensions = [".csv", ".ics", ".xlsx"];
  for (const ext of extensions) {
    const candidate = path.join(TIER3_DIR, `${baseName}${ext}`);
    if (existsSync(candidate)) {
      return { path: candidate, ext };
    }
  }
  return null;
};

const ensureExists = (filePath: string, label: string) => {
  if (!existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
};

const main = () => {
  const { caseName } = parseArgs();
  const input = findInputFile(caseName);
  if (!input) {
    throw new Error(`Input file not found for case: ${caseName}`);
  }

  const expectedPath = path.join(TIER3_DIR, `${caseName}-expected.json`);
  const mappingPath = path.join(TIER3_DIR, `${caseName}-actual-mapping.json`);
  const argsPath = path.join(TIER3_DIR, `${caseName}-args.json`);

  ensureExists(expectedPath, "Expected output");
  ensureExists(mappingPath, "Actual mapping");

  mkdirSync(PROMOTED_DIR, { recursive: true });

  const destInput = path.join(PROMOTED_DIR, `${caseName}${input.ext}`);
  const destExpected = path.join(PROMOTED_DIR, `${caseName}-expected.json`);
  const destMapping = path.join(PROMOTED_DIR, `${caseName}-mapping.json`);
  const destArgs = path.join(PROMOTED_DIR, `${caseName}-args.json`);

  if (
    existsSync(destInput) ||
    existsSync(destExpected) ||
    existsSync(destMapping)
  ) {
    throw new Error(`Destination already exists for case: ${caseName}`);
  }

  copyFileSync(input.path, destInput);
  copyFileSync(expectedPath, destExpected);
  copyFileSync(mappingPath, destMapping);
  if (existsSync(argsPath)) {
    copyFileSync(argsPath, destArgs);
  }

  process.stdout.write(
    `Promoted ${caseName} to ${path.relative(process.cwd(), PROMOTED_DIR)}\n`,
  );
};

main();
