/**
 * Check scraped curated-court CSV rows against existing curated places using
 * lexical signals plus place embeddings.
 *
 * Usage:
 *   pnpm db:check:curated-duplicates -- --file scripts/output/cebupickleballcourts-curated-courts.csv
 *   pnpm db:check:curated-duplicates -- --file scripts/output/cebupickleballcourts-curated-courts.csv --dry-run
 *   pnpm db:check:curated-duplicates -- --file scripts/output/cebupickleballcourts-curated-courts.csv --limit 25
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { cosineSimilarity, embedMany } from "ai";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  classifyCuratedDuplicateRow,
  computeCuratedDuplicateCandidateMatch,
} from "../src/lib/modules/place/curated-duplicate-checker";
import {
  buildPlaceEmbeddingCanonicalText,
  PLACE_EMBEDDING_MODEL,
  PLACE_EMBEDDING_PURPOSE_DEDUPE,
} from "../src/lib/modules/place/place-embedding";
import * as schema from "../src/lib/shared/infra/db/schema";

type ParsedRow = {
  rawRow: string[];
  sourceRowNumber: number;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  viberInfo: string | null;
  websiteUrl: string | null;
};

type ExistingPlace = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  phoneNumber: string | null;
  viberInfo: string | null;
  websiteUrl: string | null;
  embedding: number[] | null;
};

type CandidateMatch = {
  placeId: string;
  name: string;
  city: string;
  province: string;
  embeddingScore: number | null;
  lexicalScore: number;
  totalScore: number;
  sameCity: boolean;
  sameProvince: boolean;
  sameName: boolean;
  urlMatchCount: number;
  phoneMatch: boolean;
  addressTokenScore: number;
  nameTokenScore: number;
  reason: string;
};

type DecisionStatus = "approved" | "duplicate" | "review" | "invalid";

type RowDecision = {
  status: DecisionStatus;
  sourceRowNumber: number;
  row: Pick<
    ParsedRow,
    | "name"
    | "address"
    | "city"
    | "province"
    | "country"
    | "facebookUrl"
    | "instagramUrl"
    | "viberInfo"
    | "websiteUrl"
  >;
  reason: string;
  topMatch: CandidateMatch | null;
  candidates: CandidateMatch[];
};

interface ScriptOptions {
  filePath: string;
  dryRun: boolean;
  limit: number | null;
  approvedOutputPath: string | null;
  duplicateOutputPath: string | null;
  reviewOutputPath: string | null;
  reportOutputPath: string | null;
}

const REQUIRED_COLUMNS = [
  "name",
  "address",
  "city",
  "province",
  "courts",
] as const;

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    filePath: "",
    dryRun: false,
    limit: null,
    approvedOutputPath: null,
    duplicateOutputPath: null,
    reviewOutputPath: null,
    reportOutputPath: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--file") {
      const value = args[index + 1];
      if (!value) throw new Error("--file requires a path value");
      options.filePath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--file=")) {
      options.filePath = arg.replace("--file=", "");
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

    if (arg === "--approved-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--approved-output requires a path value");
      options.approvedOutputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--approved-output=")) {
      options.approvedOutputPath = arg.replace("--approved-output=", "");
      continue;
    }

    if (arg === "--duplicate-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--duplicate-output requires a path value");
      options.duplicateOutputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--duplicate-output=")) {
      options.duplicateOutputPath = arg.replace("--duplicate-output=", "");
      continue;
    }

    if (arg === "--review-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--review-output requires a path value");
      options.reviewOutputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--review-output=")) {
      options.reviewOutputPath = arg.replace("--review-output=", "");
      continue;
    }

    if (arg === "--report-output") {
      const value = args[index + 1];
      if (!value) throw new Error("--report-output requires a path value");
      options.reportOutputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--report-output=")) {
      options.reportOutputPath = arg.replace("--report-output=", "");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.filePath) {
    throw new Error("--file is required");
  }

  return options;
}

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
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

function buildHeaderMap(headers: string[]): Map<string, number> {
  return new Map(
    headers.map((header, index) => [header.trim().toLowerCase(), index]),
  );
}

function getValue(
  row: string[],
  headerMap: Map<string, number>,
  key: string,
): string {
  const index = headerMap.get(key);
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function parseRow(
  row: string[],
  headerMap: Map<string, number>,
  sourceRowNumber: number,
): ParsedRow {
  const name = getValue(row, headerMap, "name");
  const address = getValue(row, headerMap, "address");
  const city = getValue(row, headerMap, "city");
  const province = getValue(row, headerMap, "province");
  const courts = getValue(row, headerMap, "courts");

  if (!name || !address || !city || !province || !courts) {
    throw new Error(
      `Row ${sourceRowNumber}: name, address, city, province, and courts are required`,
    );
  }

  const facebookUrl = getValue(row, headerMap, "facebook_url");
  const instagramUrl = getValue(row, headerMap, "instagram_url");
  const websiteUrl = getValue(row, headerMap, "website_url");

  if (facebookUrl && !isValidUrl(facebookUrl)) {
    throw new Error(`Row ${sourceRowNumber}: facebook_url must be a valid URL`);
  }

  if (instagramUrl && !isValidUrl(instagramUrl)) {
    throw new Error(
      `Row ${sourceRowNumber}: instagram_url must be a valid URL`,
    );
  }

  if (websiteUrl && !isValidUrl(websiteUrl)) {
    throw new Error(`Row ${sourceRowNumber}: website_url must be a valid URL`);
  }

  return {
    rawRow: row,
    sourceRowNumber,
    name,
    address,
    city,
    province,
    country: "PH",
    facebookUrl: facebookUrl || null,
    instagramUrl: instagramUrl || null,
    viberInfo: getValue(row, headerMap, "viber_contact") || null,
    websiteUrl: websiteUrl || null,
  };
}

function resolveOutputPaths(options: ScriptOptions) {
  const resolvedInput = path.resolve(process.cwd(), options.filePath);
  const parsedPath = path.parse(resolvedInput);
  const basePath = path.join(parsedPath.dir, parsedPath.name);
  return {
    inputPath: resolvedInput,
    approvedPath: path.resolve(
      process.cwd(),
      options.approvedOutputPath ?? `${basePath}.approved.csv`,
    ),
    duplicatePath: path.resolve(
      process.cwd(),
      options.duplicateOutputPath ?? `${basePath}.duplicates.csv`,
    ),
    reviewPath: path.resolve(
      process.cwd(),
      options.reviewOutputPath ?? `${basePath}.review.csv`,
    ),
    reportPath: path.resolve(
      process.cwd(),
      options.reportOutputPath ?? `${basePath}.dedupe-report.json`,
    ),
  };
}

async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function escapeCsv(value: string): string {
  if (!value) return "";
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

async function writeCsv(filePath: string, headers: string[], rows: string[][]) {
  await ensureDir(filePath);
  const lines = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeCsv(value)).join(",")),
  ];
  await writeFile(filePath, `${lines.join("\n")}\n`, "utf-8");
}

async function loadExistingPlaces(
  db: ReturnType<typeof drizzle<typeof schema>>,
): Promise<ExistingPlace[]> {
  const rows = await db
    .select({
      id: schema.place.id,
      name: schema.place.name,
      address: schema.place.address,
      city: schema.place.city,
      province: schema.place.province,
      country: schema.place.country,
      facebookUrl: schema.placeContactDetail.facebookUrl,
      instagramUrl: schema.placeContactDetail.instagramUrl,
      phoneNumber: schema.placeContactDetail.phoneNumber,
      viberInfo: schema.placeContactDetail.viberInfo,
      websiteUrl: schema.placeContactDetail.websiteUrl,
      embedding: schema.placeEmbedding.embedding,
    })
    .from(schema.place)
    .leftJoin(
      schema.placeContactDetail,
      eq(schema.placeContactDetail.placeId, schema.place.id),
    )
    .leftJoin(
      schema.placeEmbedding,
      and(
        eq(schema.placeEmbedding.placeId, schema.place.id),
        eq(schema.placeEmbedding.purpose, PLACE_EMBEDDING_PURPOSE_DEDUPE),
        eq(schema.placeEmbedding.model, PLACE_EMBEDDING_MODEL),
      ),
    )
    .where(eq(schema.place.placeType, "CURATED"));

  return rows.map((row) => ({
    ...row,
    embedding: row.embedding ?? null,
  }));
}

function computeCandidateMatch(
  incoming: ParsedRow,
  incomingEmbedding: number[] | null,
  candidate: ExistingPlace,
): CandidateMatch {
  const embeddingScore =
    incomingEmbedding && candidate.embedding
      ? cosineSimilarity(incomingEmbedding, candidate.embedding)
      : null;

  return computeCuratedDuplicateCandidateMatch(
    incoming,
    candidate,
    embeddingScore,
  );
}

function classifyRow(
  incoming: ParsedRow,
  candidates: CandidateMatch[],
  seenKeys: Set<string>,
): { status: DecisionStatus; reason: string } {
  return classifyCuratedDuplicateRow(incoming, candidates, seenKeys);
}

async function main() {
  const options = parseArgs();
  const resolved = resolveOutputPaths(options);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const content = await readFile(resolved.inputPath, "utf-8");
  const csvRows = parseCsv(content);
  if (csvRows.length < 2) {
    throw new Error("CSV has no data rows to process");
  }

  const headers = csvRows[0];
  const headerMap = buildHeaderMap(headers);
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headerMap.has(column),
  );
  if (missingColumns.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missingColumns.join(", ")}`,
    );
  }

  const client = postgres(connectionString);
  const db = drizzle({ client, casing: "snake_case", schema });

  try {
    console.log("Starting curated duplicate check...\n");
    console.log(`Input: ${resolved.inputPath}`);
    console.log(`Model: ${PLACE_EMBEDDING_MODEL}`);
    console.log(`Mode: ${options.dryRun ? "dry run" : "write outputs"}\n`);

    const parsedRows: ParsedRow[] = [];
    const invalidDecisions: RowDecision[] = [];
    const limitedRows =
      options.limit !== null
        ? csvRows.slice(1, options.limit + 1)
        : csvRows.slice(1);

    for (const [index, row] of limitedRows.entries()) {
      const sourceRowNumber = index + 2;
      try {
        parsedRows.push(parseRow(row, headerMap, sourceRowNumber));
      } catch (error) {
        invalidDecisions.push({
          status: "invalid",
          sourceRowNumber,
          row: {
            name: getValue(row, headerMap, "name"),
            address: getValue(row, headerMap, "address"),
            city: getValue(row, headerMap, "city"),
            province: getValue(row, headerMap, "province"),
            country: "PH",
            facebookUrl: getValue(row, headerMap, "facebook_url") || null,
            instagramUrl: getValue(row, headerMap, "instagram_url") || null,
            viberInfo: getValue(row, headerMap, "viber_contact") || null,
            websiteUrl: getValue(row, headerMap, "website_url") || null,
          },
          reason: error instanceof Error ? error.message : "invalid csv row",
          topMatch: null,
          candidates: [],
        });
      }
    }

    const existingPlaces = await loadExistingPlaces(db);
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel(PLACE_EMBEDDING_MODEL),
      values: parsedRows.map((row) =>
        buildPlaceEmbeddingCanonicalText({
          name: row.name,
          address: row.address,
          city: row.city,
          province: row.province,
          country: row.country,
          viberInfo: row.viberInfo,
          facebookUrl: row.facebookUrl,
          instagramUrl: row.instagramUrl,
          websiteUrl: row.websiteUrl,
        }),
      ),
      maxParallelCalls: 1,
    });

    const seenKeys = new Set<string>();
    const decisions: RowDecision[] = [];

    for (const [index, row] of parsedRows.entries()) {
      const candidateMatches = existingPlaces
        .map((candidate) =>
          computeCandidateMatch(row, embeddings[index] ?? null, candidate),
        )
        .sort((left, right) => right.totalScore - left.totalScore)
        .slice(0, 5);

      const outcome = classifyRow(row, candidateMatches, seenKeys);
      decisions.push({
        status: outcome.status,
        sourceRowNumber: row.sourceRowNumber,
        row: {
          name: row.name,
          address: row.address,
          city: row.city,
          province: row.province,
          country: row.country,
          facebookUrl: row.facebookUrl,
          instagramUrl: row.instagramUrl,
          viberInfo: row.viberInfo,
          websiteUrl: row.websiteUrl,
        },
        reason: outcome.reason,
        topMatch: candidateMatches[0] ?? null,
        candidates: candidateMatches,
      });
    }

    const allDecisions = [...decisions, ...invalidDecisions].sort(
      (left, right) => left.sourceRowNumber - right.sourceRowNumber,
    );

    const approvedRows = parsedRows
      .filter((row) =>
        allDecisions.some(
          (decision) =>
            decision.sourceRowNumber === row.sourceRowNumber &&
            decision.status === "approved",
        ),
      )
      .map((row) => row.rawRow);

    const duplicateRows = parsedRows
      .filter((row) =>
        allDecisions.some(
          (decision) =>
            decision.sourceRowNumber === row.sourceRowNumber &&
            decision.status === "duplicate",
        ),
      )
      .map((row) => row.rawRow);

    const reviewRows = parsedRows
      .filter((row) =>
        allDecisions.some(
          (decision) =>
            decision.sourceRowNumber === row.sourceRowNumber &&
            (decision.status === "review" || decision.status === "invalid"),
        ),
      )
      .map((row) => row.rawRow);

    const report = {
      inputPath: resolved.inputPath,
      approvedOutputPath: resolved.approvedPath,
      duplicateOutputPath: resolved.duplicatePath,
      reviewOutputPath: resolved.reviewPath,
      checkedAt: new Date().toISOString(),
      model: PLACE_EMBEDDING_MODEL,
      totalRows: limitedRows.length,
      approvedRows: approvedRows.length,
      duplicateRows: duplicateRows.length,
      reviewRows: reviewRows.length,
      invalidRows: invalidDecisions.length,
      decisions: allDecisions,
    };

    console.log(`Rows parsed: ${parsedRows.length}`);
    console.log(`Rows approved: ${approvedRows.length}`);
    console.log(`Rows duplicates: ${duplicateRows.length}`);
    console.log(`Rows review: ${reviewRows.length}`);
    console.log(`Rows invalid: ${invalidDecisions.length}`);

    if (options.dryRun) {
      return;
    }

    await Promise.all([
      writeCsv(resolved.approvedPath, headers, approvedRows),
      writeCsv(resolved.duplicatePath, headers, duplicateRows),
      writeCsv(resolved.reviewPath, headers, reviewRows),
      ensureDir(resolved.reportPath).then(() =>
        writeFile(
          resolved.reportPath,
          `${JSON.stringify(report, null, 2)}\n`,
          "utf-8",
        ),
      ),
    ]);

    console.log(`\nWrote approved rows to ${resolved.approvedPath}`);
    console.log(`Wrote duplicate rows to ${resolved.duplicatePath}`);
    console.log(`Wrote review rows to ${resolved.reviewPath}`);
    console.log(`Wrote dedupe report to ${resolved.reportPath}`);
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
