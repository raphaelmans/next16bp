import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/shared/infra/db/schema";
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
import { buildCuratedFacebookScopePaths } from "../shared/scope-paths";
import { runCuratedCourtImportCli } from "./curated-court-import.service";
import { runCuratedDuplicatePreflightCli } from "./curated-duplicate-preflight.service";
import { runCuratedFacebookPageCaptureCli } from "./curated-facebook-page-capture.service";
import { runCuratedFacebookPageDiscoveryCli } from "./curated-facebook-page-discovery.service";
import { runPlaceEmbeddingBackfillCli } from "./place-embedding-backfill.service";

interface ScriptOptions {
  province: string | null;
  city: string | null;
  sportSlug: string;
  scopeSource: "configured" | "artifact:url" | "artifact:facebook";
}

interface ApprovedCsvRow {
  rawRow: string[];
  name: string;
  city: string;
  province: string;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    province: null,
    city: null,
    sportSlug: CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
    scopeSource: "artifact:url",
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
    if (arg === "--scope-source") {
      const value = args[index + 1];
      if (!value) throw new Error("--scope-source requires a value");
      if (
        value !== "configured" &&
        value !== "artifact:url" &&
        value !== "artifact:facebook"
      ) {
        throw new Error(
          "--scope-source must be one of: configured, artifact:url, artifact:facebook",
        );
      }
      options.scopeSource = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--scope-source=")) {
      const value = arg.replace("--scope-source=", "");
      if (
        value !== "configured" &&
        value !== "artifact:url" &&
        value !== "artifact:facebook"
      ) {
        throw new Error(
          "--scope-source must be one of: configured, artifact:url, artifact:facebook",
        );
      }
      options.scopeSource = value;
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
    if (char === "\r") continue;
    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => cell.trim().length > 0));
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(headers: string[], row: string[]): string {
  return `${headers.join(",")}\n${row.map((value) => escapeCsv(value)).join(",")}\n`;
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

async function listFilesRecursive(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function hasCsvDataRows(csvRows: string[][]): boolean {
  return csvRows
    .slice(1)
    .some((row) => row.some((cell) => cell.trim().length > 0));
}

async function csvFileHasDataRows(filePath: string): Promise<boolean> {
  if (!(await fileExists(filePath))) {
    return false;
  }

  const content = await readFile(filePath, "utf-8");
  return hasCsvDataRows(parseCsv(content));
}

async function resolveScopesFromArtifacts(input: {
  baseDir: string;
  runStateFileName: string;
  sportSlug: string;
}): Promise<ResolvedCuratedDiscoveryScope[]> {
  let files: string[];
  try {
    files = await listFilesRecursive(input.baseDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const runStateFiles = files.filter((filePath) =>
    filePath.endsWith(input.runStateFileName),
  );
  const scopes = new Map<string, ResolvedCuratedDiscoveryScope>();

  for (const filePath of runStateFiles) {
    try {
      const parsed = JSON.parse(await readFile(filePath, "utf-8")) as {
        scope?: {
          provinceSlug?: string;
          citySlug?: string;
          provinceName?: string;
          cityName?: string;
          sportSlug?: string;
        };
        stages?: {
          discovery?: { status?: string };
          scrape?: { status?: string };
          duplicatePreflight?: { status?: string };
          facebookDiscovery?: { status?: string };
          facebookCapture?: { status?: string };
          facebookDuplicatePreflight?: { status?: string };
        };
      };

      const scope = parsed.scope;
      if (
        !scope?.provinceSlug ||
        !scope.citySlug ||
        !scope.provinceName ||
        !scope.cityName ||
        scope.sportSlug !== input.sportSlug
      ) {
        continue;
      }

      const touched =
        parsed.stages?.discovery?.status !== "pending" ||
        parsed.stages?.scrape?.status !== "pending" ||
        parsed.stages?.duplicatePreflight?.status !== "pending" ||
        parsed.stages?.facebookDiscovery?.status !== "pending" ||
        parsed.stages?.facebookCapture?.status !== "pending" ||
        parsed.stages?.facebookDuplicatePreflight?.status !== "pending";

      if (!touched) {
        continue;
      }

      const key = `${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}`;
      scopes.set(key, {
        sportSlug: scope.sportSlug,
        provinceSlug: scope.provinceSlug,
        citySlug: scope.citySlug,
        provinceName: scope.provinceName,
        cityName: scope.cityName,
      });
    } catch {
      // ignore malformed artifact files
    }
  }

  return Array.from(scopes.values()).sort((left, right) => {
    const leftKey = `${left.provinceSlug}:${left.citySlug}`;
    const rightKey = `${right.provinceSlug}:${right.citySlug}`;
    return leftKey.localeCompare(rightKey);
  });
}

function setStageStatus(
  state: CuratedIngestionRunState,
  stageName:
    | "facebookDiscovery"
    | "facebookCapture"
    | "facebookDuplicatePreflight"
    | "facebookImportApproved"
    | "dbVerification"
    | "embeddingBackfill",
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

function resetFacebookDownstreamStagesForRecapture(
  state: CuratedIngestionRunState,
) {
  const emptyCsvNote = "facebook capture CSV has no data rows";
  if (
    state.stages.facebookDuplicatePreflight.status === "skipped" &&
    state.stages.facebookDuplicatePreflight.notes === emptyCsvNote
  ) {
    state.stages.facebookDuplicatePreflight = {
      status: "pending",
      startedAt: null,
      finishedAt: null,
      lastError: null,
      notes: null,
    };
  }
  if (
    state.stages.facebookImportApproved.status === "skipped" &&
    state.stages.facebookImportApproved.notes === emptyCsvNote
  ) {
    state.stages.facebookImportApproved = {
      status: "pending",
      startedAt: null,
      finishedAt: null,
      lastError: null,
      notes: null,
    };
  }
  if (
    state.stages.dbVerification.status === "skipped" &&
    state.stages.dbVerification.notes === emptyCsvNote
  ) {
    state.stages.dbVerification = {
      status: "pending",
      startedAt: null,
      finishedAt: null,
      lastError: null,
      notes: null,
    };
  }
  if (
    state.stages.embeddingBackfill.status === "skipped" &&
    state.stages.embeddingBackfill.notes === emptyCsvNote
  ) {
    state.stages.embeddingBackfill = {
      status: "pending",
      startedAt: null,
      finishedAt: null,
      lastError: null,
      notes: null,
    };
  }
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
  scopePaths: ReturnType<typeof buildCuratedFacebookScopePaths>,
) {
  if (
    !isStageDone(state.stages.facebookDiscovery) &&
    (await fileExists(scopePaths.urlsPath)) &&
    (await fileExists(scopePaths.statePath)) &&
    (await fileExists(scopePaths.reportPath))
  ) {
    setStageStatus(
      state,
      "facebookDiscovery",
      "completed",
      "reconciled from artifacts",
    );
  }

  if (
    !isStageDone(state.stages.facebookCapture) &&
    (await fileExists(scopePaths.captureOutputPath)) &&
    (await fileExists(scopePaths.captureStatePath)) &&
    (await fileExists(scopePaths.captureReportPath))
  ) {
    setStageStatus(
      state,
      "facebookCapture",
      "completed",
      "reconciled from artifacts",
    );
  }

  const hasCaptureRows = await csvFileHasDataRows(scopePaths.csvOutputPath);
  if (!hasCaptureRows) {
    setStageStatus(
      state,
      "facebookDuplicatePreflight",
      "skipped",
      "facebook capture CSV has no data rows",
    );
    setStageStatus(
      state,
      "facebookImportApproved",
      "skipped",
      "facebook capture CSV has no data rows",
    );
    setStageStatus(
      state,
      "dbVerification",
      "skipped",
      "facebook capture CSV has no data rows",
    );
    setStageStatus(
      state,
      "embeddingBackfill",
      "skipped",
      "facebook capture CSV has no data rows",
    );
    return;
  }

  if (
    !isStageDone(state.stages.facebookDuplicatePreflight) &&
    (await fileExists(scopePaths.dedupeReportPath))
  ) {
    setStageStatus(
      state,
      "facebookDuplicatePreflight",
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
    if (!isStageDone(state.stages.facebookImportApproved)) {
      setStageStatus(
        state,
        "facebookImportApproved",
        "skipped",
        "no approved facebook rows after duplicate preflight",
      );
    }
    if (!isStageDone(state.stages.dbVerification)) {
      setStageStatus(
        state,
        "dbVerification",
        "skipped",
        "no approved facebook rows after duplicate preflight",
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

    if (!isStageDone(state.stages.facebookImportApproved)) {
      setStageStatus(
        state,
        "facebookImportApproved",
        "completed",
        "all approved facebook rows already present in DB",
      );
    }
    if (!isStageDone(state.stages.dbVerification)) {
      setStageStatus(
        state,
        "dbVerification",
        "completed",
        "all approved facebook rows verified in DB",
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
        "all imported facebook rows already have embeddings",
      );
    }
  }
}

async function importApprovedRowsSequentially(
  db: ReturnType<typeof drizzle<typeof schema>>,
  approvedOutputPath: string,
  importQueueDir: string,
  state: CuratedIngestionRunState,
) {
  const approved = await loadApprovedRows(approvedOutputPath);

  if (approved.rows.length === 0) {
    setStageStatus(
      state,
      "facebookImportApproved",
      "skipped",
      "approved CSV has no data rows",
    );
    setStageStatus(
      state,
      "dbVerification",
      "skipped",
      "approved CSV has no data rows",
    );
    setStageStatus(
      state,
      "embeddingBackfill",
      "skipped",
      "approved CSV has no data rows",
    );
    return;
  }

  await mkdir(importQueueDir, { recursive: true });

  const importedPlaceIds = new Set<string>();
  for (const [index, row] of approved.rows.entries()) {
    const existingPlaces = await loadExistingPlacesByApprovedRows(db, [row]);
    if (existingPlaces.length === 1) {
      importedPlaceIds.add(existingPlaces[0].id);
      continue;
    }

    const queuePath = path.join(
      importQueueDir,
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
    "facebookImportApproved",
    "completed",
    `processed ${approved.rows.length} approved facebook rows sequentially`,
  );
}

function isScopeComplete(state: CuratedIngestionRunState): boolean {
  return (
    isStageDone(state.stages.facebookDiscovery) &&
    isStageDone(state.stages.facebookCapture) &&
    isStageDone(state.stages.facebookDuplicatePreflight) &&
    isStageDone(state.stages.facebookImportApproved) &&
    isStageDone(state.stages.dbVerification) &&
    isStageDone(state.stages.embeddingBackfill)
  );
}

async function runScope(
  db: ReturnType<typeof drizzle<typeof schema>>,
  repository: CuratedIngestionRunStateRepository,
  scope: ResolvedCuratedDiscoveryScope,
) {
  const scopePaths = buildCuratedFacebookScopePaths({
    city: scope.citySlug,
    province: scope.provinceSlug,
    sportSlug: scope.sportSlug,
  });
  const scopeKey = `${scope.sportSlug}:${scope.provinceSlug}:${scope.citySlug}:facebook`;
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
      `Skipping completed Facebook scope: ${scope.provinceSlug} / ${scope.citySlug}`,
    );
    return { scope, status: "skipped" as const, state, scopePaths };
  }

  try {
    if (!isStageDone(state.stages.facebookDiscovery)) {
      setStageStatus(state, "facebookDiscovery", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runCuratedFacebookPageDiscoveryCli([
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
      ]);
      setStageStatus(
        state,
        "facebookDiscovery",
        "completed",
        "runner executed facebook discovery",
      );
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.facebookCapture)) {
      setStageStatus(state, "facebookCapture", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runCuratedFacebookPageCaptureCli([
        "--province",
        scope.provinceSlug,
        "--city",
        scope.citySlug,
        "--sport-slug",
        scope.sportSlug,
        "--urls-file",
        scopePaths.urlsPath,
        "--capture-output",
        scopePaths.captureOutputPath,
        "--state",
        scopePaths.captureStatePath,
        "--csv-output",
        scopePaths.csvOutputPath,
        "--report-output",
        scopePaths.captureReportPath,
      ]);
      setStageStatus(
        state,
        "facebookCapture",
        "completed",
        "runner executed facebook capture",
      );
      if (await csvFileHasDataRows(scopePaths.csvOutputPath)) {
        resetFacebookDownstreamStagesForRecapture(state);
      }
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!(await csvFileHasDataRows(scopePaths.csvOutputPath))) {
      setStageStatus(
        state,
        "facebookDuplicatePreflight",
        "skipped",
        "facebook capture CSV has no data rows",
      );
      setStageStatus(
        state,
        "facebookImportApproved",
        "skipped",
        "facebook capture CSV has no data rows",
      );
      setStageStatus(
        state,
        "dbVerification",
        "skipped",
        "facebook capture CSV has no data rows",
      );
      setStageStatus(
        state,
        "embeddingBackfill",
        "skipped",
        "facebook capture CSV has no data rows",
      );
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.facebookDuplicatePreflight)) {
      setStageStatus(state, "facebookDuplicatePreflight", "running");
      await repository.save(scopePaths.runStatePath, state);
      await runCuratedDuplicatePreflightCli([
        "--file",
        scopePaths.csvOutputPath,
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
        "facebookDuplicatePreflight",
        "completed",
        "runner executed facebook duplicate preflight",
      );
      await repository.save(scopePaths.runStatePath, state);
      await reconcileStateFromArtifacts(db, state, scopePaths);
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.facebookImportApproved)) {
      setStageStatus(state, "facebookImportApproved", "running");
      await repository.save(scopePaths.runStatePath, state);
      await importApprovedRowsSequentially(
        db,
        scopePaths.approvedOutputPath,
        scopePaths.importQueueDir,
        state,
      );
      await repository.save(scopePaths.runStatePath, state);
    }

    if (!isStageDone(state.stages.dbVerification)) {
      if (state.importedPlaceIds.length === 0) {
        setStageStatus(
          state,
          "dbVerification",
          "skipped",
          "no imported facebook place ids",
        );
      } else {
        const embeddings = await loadExistingPlacesByApprovedRows(
          db,
          (await loadApprovedRows(scopePaths.approvedOutputPath)).rows,
        );
        if (embeddings.length !== state.importedPlaceIds.length) {
          throw new Error(
            "Facebook DB verification did not find every imported row",
          );
        }
        setStageStatus(
          state,
          "dbVerification",
          "completed",
          `verified ${state.importedPlaceIds.length} facebook rows in DB`,
        );
      }
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
          `backfilled ${state.importedPlaceIds.length} facebook place ids`,
        );
      }
      await repository.save(scopePaths.runStatePath, state);
    }

    await writeFile(
      scopePaths.runReportPath,
      `${JSON.stringify({ scope, importedPlaceIds: state.importedPlaceIds, stages: state.stages }, null, 2)}\n`,
      "utf-8",
    );

    return { scope, status: "completed" as const, state, scopePaths };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Facebook runner error";
    const currentStage = (Object.entries(state.stages).find(
      ([key, stage]) =>
        [
          "facebookDiscovery",
          "facebookCapture",
          "facebookDuplicatePreflight",
          "facebookImportApproved",
          "dbVerification",
          "embeddingBackfill",
        ].includes(key) && stage.status === "running",
    ) ?? ["facebookDiscovery"])[0] as
      | "facebookDiscovery"
      | "facebookCapture"
      | "facebookDuplicatePreflight"
      | "facebookImportApproved"
      | "dbVerification"
      | "embeddingBackfill";

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
        : options.scopeSource === "configured"
          ? await resolveDefaultCuratedDiscoveryScopes()
          : options.scopeSource === "artifact:facebook"
            ? await resolveScopesFromArtifacts({
                baseDir: path.join("scripts", "output", "discovery-facebook"),
                runStateFileName: "facebook-run-state.json",
                sportSlug: options.sportSlug,
              })
            : await resolveScopesFromArtifacts({
                baseDir: path.join("scripts", "output", "discovery"),
                runStateFileName: "run-state.json",
                sportSlug: options.sportSlug,
              });

    if (scopes.length === 0) {
      console.log("No scopes resolved for Facebook runner.");
      return;
    }

    const results: Awaited<ReturnType<typeof runScope>>[] = [];
    for (const scope of scopes) {
      console.log(
        `\n=== FACEBOOK RUN ${scope.provinceSlug} / ${scope.citySlug} ===`,
      );
      const result = await runScope(db, repository, scope);
      results.push(result);
    }

    const failedScopes = results.filter((result) => result.status === "failed");
    console.log("\n=== Facebook Curated Ingestion Runner Summary ===");
    console.log(
      `Completed scopes: ${results.filter((result) => result.status === "completed").length}`,
    );
    console.log(
      `Skipped scopes: ${results.filter((result) => result.status === "skipped").length}`,
    );
    console.log(`Failed scopes: ${failedScopes.length}`);

    if (failedScopes.length > 0) {
      for (const result of failedScopes) {
        console.error(
          `  Failed: ${result.scope.provinceSlug} / ${result.scope.citySlug} -> ${result.error}`,
        );
      }
      throw new Error(
        `Facebook curated ingestion runner completed with ${failedScopes.length} failed scope(s)`,
      );
    }
  } finally {
    await client.end();
  }
}

export function runCuratedFacebookIngestionRunnerCli(cliArgs?: string[]) {
  return runCliWithOptionalArgs(cliArgs, main);
}

if (isDirectExecution(import.meta.url)) {
  runCuratedFacebookIngestionRunnerCli()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
