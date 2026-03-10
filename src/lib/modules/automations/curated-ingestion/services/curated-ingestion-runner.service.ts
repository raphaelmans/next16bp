import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/shared/infra/db/schema";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";
import {
  type CuratedIngestionRunState,
  CuratedIngestionRunStateRepository,
  type CuratedIngestionStageState,
  type CuratedIngestionStageStatus,
} from "../repositories/curated-ingestion-run-state.repository";
import {
  isDirectExecution,
  runCliWithOptionalArgs,
} from "../shared/cli-runtime";
import {
  CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
  type ResolvedCuratedDiscoveryScope,
  resolveCuratedDiscoveryScopeOrThrow,
  resolveDefaultCuratedDiscoveryScopes,
} from "../shared/curated-discovery-scopes";
import { buildCuratedDiscoveryScopePaths } from "../shared/scope-paths";
import { runCuratedCourtImportCli } from "./curated-court-import.service";
import { runCuratedDuplicatePreflightCli } from "./curated-duplicate-preflight.service";
import { runCuratedLeadDiscoveryCli } from "./curated-lead-discovery.service";
import { runFirecrawlCuratedCourtsCli } from "./firecrawl-curated-courts.service";
import { runPlaceEmbeddingBackfillCli } from "./place-embedding-backfill.service";

interface ScriptOptions {
  province: string | null;
  city: string | null;
  sportSlug: string;
}

interface ApprovedCsvRow {
  rawRow: string[];
  name: string;
  city: string;
  province: string;
}

const RUNNER_START_URL = "https://kudoscourts.com/";

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    province: null,
    city: null,
    sportSlug: CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

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

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (
    (options.province && !options.city) ||
    (!options.province && options.city)
  ) {
    throw new Error("--province and --city must be provided together");
  }

  if (!options.sportSlug) {
    throw new Error("--sport-slug cannot be empty");
  }

  return options;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inQuotes) {
      if (char === '"') {
        const next = content[index + 1];
        if (next === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => cell.trim().length > 0));
}

function toCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(headers: string[], row: string[]): string {
  return `${headers.join(",")}\n${row.map((value) => toCsvValue(value)).join(",")}\n`;
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => toCsvValue(value)).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath, "utf-8");
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function setStageStatus(
  state: CuratedIngestionRunState,
  stageName: keyof CuratedIngestionRunState["stages"],
  status: CuratedIngestionStageStatus,
  notes: string | null = null,
  lastError: string | null = null,
) {
  const stage = state.stages[stageName];
  const nowIso = new Date().toISOString();

  state.stages[stageName] = {
    ...stage,
    status,
    startedAt: status === "running" ? nowIso : stage.startedAt,
    finishedAt:
      status === "completed" || status === "failed" || status === "skipped"
        ? nowIso
        : stage.finishedAt,
    notes,
    lastError,
  };
}

function isStageDone(stage: CuratedIngestionStageState): boolean {
  return stage.status === "completed" || stage.status === "skipped";
}

async function loadApprovedRows(filePath: string): Promise<{
  headers: string[];
  rows: ApprovedCsvRow[];
}> {
  const content = await readFile(filePath, "utf-8");
  const csvRows = parseCsv(content);
  if (csvRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = csvRows[0] ?? [];
  const rows = (csvRows.slice(1) ?? []).map((row) => ({
    rawRow: row,
    name: (row[0] ?? "").trim(),
    city: (row[2] ?? "").trim(),
    province: (row[3] ?? "").trim(),
  }));

  return {
    headers,
    rows: rows.filter((row) => row.name && row.city && row.province),
  };
}

async function filterApprovedRowsToScope(
  filePath: string,
  scope: ResolvedCuratedDiscoveryScope,
) {
  const approved = await loadApprovedRows(filePath);
  const provinces = await getPHProvincesCities();
  const inScopeRows: ApprovedCsvRow[] = [];
  const outOfScopeRows: ApprovedCsvRow[] = [];

  for (const row of approved.rows) {
    const resolved = resolveLocationSlugs(provinces, row.province, row.city);

    if (
      resolved.province?.slug === scope.provinceSlug &&
      resolved.city?.slug === scope.citySlug
    ) {
      inScopeRows.push(row);
      continue;
    }

    outOfScopeRows.push(row);
  }

  return {
    headers: approved.headers,
    inScopeRows,
    outOfScopeRows,
  };
}

async function loadExistingPlacesByApprovedRows(
  db: ReturnType<typeof drizzle<typeof schema>>,
  approvedRows: ApprovedCsvRow[],
) {
  const names = Array.from(new Set(approvedRows.map((row) => row.name)));
  if (names.length === 0) return [];

  const places = await db
    .select({
      id: schema.place.id,
      name: schema.place.name,
      city: schema.place.city,
      province: schema.place.province,
    })
    .from(schema.place)
    .where(inArray(schema.place.name, names));

  return approvedRows
    .map((row) =>
      places.find(
        (place) =>
          place.name === row.name &&
          place.city === row.city &&
          place.province === row.province,
      ),
    )
    .filter(
      (
        place,
      ): place is {
        id: string;
        name: string;
        city: string;
        province: string;
      } => Boolean(place),
    );
}

async function loadEmbeddingsForPlaceIds(
  db: ReturnType<typeof drizzle<typeof schema>>,
  placeIds: string[],
) {
  if (placeIds.length === 0) return [];

  return db
    .select({ placeId: schema.placeEmbedding.placeId })
    .from(schema.placeEmbedding)
    .where(
      and(
        inArray(schema.placeEmbedding.placeId, placeIds),
        eq(schema.placeEmbedding.purpose, "dedupe"),
        eq(schema.placeEmbedding.model, "text-embedding-3-small"),
      ),
    );
}

async function reconcileStateFromArtifacts(
  db: ReturnType<typeof drizzle<typeof schema>>,
  state: CuratedIngestionRunState,
  scopePaths: ReturnType<typeof buildCuratedDiscoveryScopePaths>,
) {
  if (
    !isStageDone(state.stages.discovery) &&
    (await fileExists(scopePaths.urlsPath)) &&
    (await fileExists(scopePaths.statePath)) &&
    (await fileExists(scopePaths.reportPath))
  ) {
    setStageStatus(
      state,
      "discovery",
      "completed",
      "reconciled from artifacts",
    );
  }

  if (
    !isStageDone(state.stages.scrape) &&
    (await fileExists(scopePaths.scrapeOutputPath)) &&
    (await fileExists(scopePaths.scrapeStatePath))
  ) {
    setStageStatus(state, "scrape", "completed", "reconciled from artifacts");
  }

  if (
    !isStageDone(state.stages.duplicatePreflight) &&
    (await fileExists(scopePaths.dedupeReportPath))
  ) {
    setStageStatus(
      state,
      "duplicatePreflight",
      "completed",
      "reconciled from artifacts",
    );
  }

  if (!(await fileExists(scopePaths.dedupeReportPath))) {
    return;
  }

  const report = JSON.parse(
    await readFile(scopePaths.dedupeReportPath, "utf-8"),
  ) as {
    approvedRows?: number;
  };

  const approvedRowsCount = Number(report.approvedRows ?? 0);
  if (approvedRowsCount === 0) {
    if (!isStageDone(state.stages.importApproved)) {
      setStageStatus(
        state,
        "importApproved",
        "skipped",
        "no approved rows after duplicate preflight",
      );
    }
    if (!isStageDone(state.stages.dbVerification)) {
      setStageStatus(
        state,
        "dbVerification",
        "skipped",
        "no approved rows after duplicate preflight",
      );
    }
    if (!isStageDone(state.stages.embeddingBackfill)) {
      setStageStatus(
        state,
        "embeddingBackfill",
        "skipped",
        "no imported place ids",
      );
    }
    return;
  }

  if (!(await fileExists(scopePaths.approvedOutputPath))) {
    return;
  }

  const approvedRows = await loadApprovedRows(scopePaths.approvedOutputPath);
  const verifiedPlaces = await loadExistingPlacesByApprovedRows(
    db,
    approvedRows.rows,
  );

  if (verifiedPlaces.length === approvedRows.rows.length) {
    state.importedPlaceIds = Array.from(
      new Set(verifiedPlaces.map((place) => place.id)),
    );

    if (!isStageDone(state.stages.importApproved)) {
      setStageStatus(
        state,
        "importApproved",
        "completed",
        "all approved rows already present in DB",
      );
    }

    if (!isStageDone(state.stages.dbVerification)) {
      setStageStatus(
        state,
        "dbVerification",
        "completed",
        "all approved rows verified in DB",
      );
    }

    const embeddings = await loadEmbeddingsForPlaceIds(
      db,
      state.importedPlaceIds,
    );
    if (embeddings.length === state.importedPlaceIds.length) {
      setStageStatus(
        state,
        "embeddingBackfill",
        "completed",
        "all imported rows already have embeddings",
      );
    }
  }
}

async function importApprovedRowsSequentially(
  db: ReturnType<typeof drizzle<typeof schema>>,
  scopePaths: ReturnType<typeof buildCuratedDiscoveryScopePaths>,
  state: CuratedIngestionRunState,
  scope: ResolvedCuratedDiscoveryScope,
) {
  const approved = await filterApprovedRowsToScope(
    scopePaths.approvedOutputPath,
    scope,
  );

  if (approved.outOfScopeRows.length > 0) {
    await writeFile(
      scopePaths.approvedOutputPath,
      buildCsvContent(
        approved.headers,
        approved.inScopeRows.map((row) => row.rawRow),
      ),
      "utf-8",
    );
  }

  if (approved.inScopeRows.length === 0) {
    setStageStatus(
      state,
      "importApproved",
      "skipped",
      approved.outOfScopeRows.length > 0
        ? `all approved rows were out of scope for ${scope.citySlug}, skipped ${approved.outOfScopeRows.length}`
        : "approved CSV has no data rows",
    );
    setStageStatus(
      state,
      "dbVerification",
      "skipped",
      approved.outOfScopeRows.length > 0
        ? `all approved rows were out of scope for ${scope.citySlug}`
        : "approved CSV has no data rows",
    );
    setStageStatus(
      state,
      "embeddingBackfill",
      "skipped",
      approved.outOfScopeRows.length > 0
        ? "all approved rows were out of scope"
        : "approved CSV has no data rows",
    );
    return;
  }

  await mkdir(scopePaths.importQueueDir, { recursive: true });

  const importedPlaceIds = new Set<string>();

  for (const [index, row] of approved.inScopeRows.entries()) {
    const existingPlaces = await loadExistingPlacesByApprovedRows(db, [row]);
    if (existingPlaces.length === 1) {
      importedPlaceIds.add(existingPlaces[0].id);
      continue;
    }

    const queuePath = path.join(
      scopePaths.importQueueDir,
      `${String(index + 1).padStart(4, "0")}.csv`,
    );
    await writeFile(queuePath, buildCsv(approved.headers, row.rawRow), "utf-8");
    await runCuratedCourtImportCli(["--file", queuePath]);

    const createdPlaces = await loadExistingPlacesByApprovedRows(db, [row]);
    if (createdPlaces.length !== 1) {
      throw new Error(
        `Post-import verification failed for ${row.name} (${row.city}, ${row.province})`,
      );
    }

    importedPlaceIds.add(createdPlaces[0].id);
  }

  state.importedPlaceIds = Array.from(importedPlaceIds);
  setStageStatus(
    state,
    "importApproved",
    "completed",
    approved.outOfScopeRows.length > 0
      ? `processed ${approved.inScopeRows.length} approved rows sequentially; skipped ${approved.outOfScopeRows.length} out-of-scope rows`
      : `processed ${approved.inScopeRows.length} approved rows sequentially`,
  );
  setStageStatus(
    state,
    "dbVerification",
    "completed",
    `verified ${state.importedPlaceIds.length} rows in DB`,
  );
}

function isScopeComplete(state: CuratedIngestionRunState): boolean {
  return (
    isStageDone(state.stages.discovery) &&
    isStageDone(state.stages.scrape) &&
    isStageDone(state.stages.duplicatePreflight) &&
    isStageDone(state.stages.importApproved) &&
    isStageDone(state.stages.dbVerification) &&
    isStageDone(state.stages.embeddingBackfill)
  );
}

async function runScope(
  db: ReturnType<typeof drizzle<typeof schema>>,
  repository: CuratedIngestionRunStateRepository,
  scope: ResolvedCuratedDiscoveryScope,
) {
  const scopePaths = buildCuratedDiscoveryScopePaths({
    city: scope.citySlug,
    province: scope.provinceSlug,
    sportSlug: scope.sportSlug,
  });
  const scopeKey = `${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}`;
  const state = await repository.load(scopePaths.runStatePath, scopeKey, {
    provinceSlug: scope.provinceSlug,
    citySlug: scope.citySlug,
    provinceName: scope.provinceName,
    cityName: scope.cityName,
    sportSlug: scope.sportSlug,
  });

  await reconcileStateFromArtifacts(db, state, scopePaths);
  await repository.save(scopePaths.runStatePath, state);

  if (isScopeComplete(state)) {
    console.log(
      `Skipping completed scope: ${scope.provinceSlug} / ${scope.citySlug}`,
    );
    return {
      scope,
      status: "skipped" as const,
      state,
      scopePaths,
    };
  }

  try {
    if (!isStageDone(state.stages.discovery)) {
      setStageStatus(state, "discovery", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runCuratedLeadDiscoveryCli([
        "--province",
        scope.provinceSlug,
        "--city",
        scope.citySlug,
        "--sport-slug",
        scope.sportSlug,
        "--output",
        scopePaths.urlsPath,
        "--state",
        scopePaths.statePath,
        "--report-output",
        scopePaths.reportPath,
        "--scrape-state",
        scopePaths.scrapeStatePath,
      ]);
      setStageStatus(
        state,
        "discovery",
        "completed",
        "runner executed discovery",
      );
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.scrape)) {
      if (!(await fileExists(scopePaths.urlsPath))) {
        throw new Error(`Missing discovery output: ${scopePaths.urlsPath}`);
      }

      setStageStatus(state, "scrape", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runFirecrawlCuratedCourtsCli([
        "--start-url",
        RUNNER_START_URL,
        "--urls-file",
        scopePaths.urlsPath,
        "--output",
        scopePaths.scrapeOutputPath,
        "--raw-output",
        scopePaths.scrapeRawOutputPath,
        "--state",
        scopePaths.scrapeStatePath,
        "--coverage-output",
        scopePaths.scrapeCoverageOutputPath,
        "--skip-db-coverage",
        "--include=",
        "--trust-urls-file",
      ]);
      setStageStatus(state, "scrape", "completed", "runner executed scrape");
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.duplicatePreflight)) {
      if (!(await fileExists(scopePaths.scrapeOutputPath))) {
        throw new Error(
          `Missing scrape output: ${scopePaths.scrapeOutputPath}`,
        );
      }

      setStageStatus(state, "duplicatePreflight", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runCuratedDuplicatePreflightCli([
        "--file",
        scopePaths.scrapeOutputPath,
        "--approved-output",
        scopePaths.approvedOutputPath,
        "--duplicate-output",
        scopePaths.duplicateOutputPath,
        "--review-output",
        scopePaths.reviewOutputPath,
        "--report-output",
        scopePaths.dedupeReportPath,
      ]);
      setStageStatus(
        state,
        "duplicatePreflight",
        "completed",
        "runner executed duplicate preflight",
      );
      await repository.save(scopePaths.runStatePath, state);
      await reconcileStateFromArtifacts(db, state, scopePaths);
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.importApproved)) {
      setStageStatus(state, "importApproved", "running");
      await repository.save(scopePaths.runStatePath, state);
      await importApprovedRowsSequentially(db, scopePaths, state, scope);
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.embeddingBackfill)) {
      if (state.importedPlaceIds.length === 0) {
        setStageStatus(
          state,
          "embeddingBackfill",
          "skipped",
          "no imported place ids to backfill",
        );
      } else {
        setStageStatus(state, "embeddingBackfill", "running");
        await repository.save(scopePaths.runStatePath, state);
        await runPlaceEmbeddingBackfillCli([
          "--place-ids",
          state.importedPlaceIds.join(","),
        ]);
        setStageStatus(
          state,
          "embeddingBackfill",
          "completed",
          `backfilled ${state.importedPlaceIds.length} place ids`,
        );
      }
      await repository.save(scopePaths.runStatePath, state);
    }

    const scopeReport = {
      scope,
      importedPlaceIds: state.importedPlaceIds,
      stages: state.stages,
    };
    await writeFile(
      scopePaths.runReportPath,
      `${JSON.stringify(scopeReport, null, 2)}\n`,
      "utf-8",
    );

    return {
      scope,
      status: "completed" as const,
      state,
      scopePaths,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown runner error";
    const currentStage = (Object.entries(state.stages).find(
      ([, stage]) => stage.status === "running",
    ) ?? ["discovery"])[0] as keyof CuratedIngestionRunState["stages"];

    setStageStatus(state, currentStage, "failed", null, message);
    await repository.save(scopePaths.runStatePath, state);
    await writeFile(
      scopePaths.runReportPath,
      `${JSON.stringify(
        {
          scope,
          importedPlaceIds: state.importedPlaceIds,
          stages: state.stages,
          failedStage: currentStage,
          error: message,
        },
        null,
        2,
      )}\n`,
      "utf-8",
    );

    return {
      scope,
      status: "failed" as const,
      error: message,
      state,
      scopePaths,
    };
  }
}

async function main() {
  const options = parseArgs();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });
  const repository = new CuratedIngestionRunStateRepository();

  try {
    const scopes =
      options.province && options.city
        ? [
            await resolveCuratedDiscoveryScopeOrThrow({
              sportSlug: options.sportSlug,
              provinceValue: options.province,
              cityValue: options.city,
            }),
          ]
        : await resolveDefaultCuratedDiscoveryScopes();

    const results: Awaited<ReturnType<typeof runScope>>[] = [];
    for (const scope of scopes) {
      console.log(`\n=== RUN ${scope.provinceSlug} / ${scope.citySlug} ===`);
      const result = await runScope(db, repository, scope);
      results.push(result);
    }

    const failedScopes = results.filter((result) => result.status === "failed");
    const completedScopes = results.filter(
      (result) => result.status === "completed",
    );
    const skippedScopes = results.filter(
      (result) => result.status === "skipped",
    );

    console.log("\n=== Curated Ingestion Runner Summary ===");
    console.log(`Completed scopes: ${completedScopes.length}`);
    console.log(`Skipped scopes: ${skippedScopes.length}`);
    console.log(`Failed scopes: ${failedScopes.length}`);

    if (failedScopes.length > 0) {
      for (const result of failedScopes) {
        console.error(
          `  Failed: ${result.scope.provinceSlug} / ${result.scope.citySlug} -> ${result.error}`,
        );
      }
      throw new Error(
        `Curated ingestion runner completed with ${failedScopes.length} failed scope(s)`,
      );
    }
  } finally {
    await client.end();
  }
}

export function runCuratedIngestionRunnerCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, main);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedIngestionRunnerCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
