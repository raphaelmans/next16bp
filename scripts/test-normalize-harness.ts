import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Output schema (matches normalize-data.ts OutputSchema)
// ---------------------------------------------------------------------------

const ResourceSchema = z.object({
  resourceId: z.string().min(1),
  label: z.string().min(1),
  sport: z
    .enum(["pickleball", "basketball", "badminton", "tennis", "unknown"])
    .optional(),
});

const BlockSchema = z.object({
  resourceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().nullable().optional(),
  source: z
    .object({
      format: z.enum(["ics", "csv", "xlsx", "image"]),
      row: z.number().int().positive().optional(),
      uid: z.string().optional(),
    })
    .optional(),
});

const ErrorSchema = z.object({
  message: z.string().min(1),
  format: z.enum(["ics", "csv", "xlsx", "image"]).optional(),
  row: z.number().int().positive().optional(),
  uid: z.string().optional(),
});

export const OutputSchema = z.object({
  meta: z.object({
    format: z.enum(["ics", "csv", "xlsx", "image"]),
    timeZoneFallback: z.string().min(1),
    isMultiCourt: z.boolean(),
    resources: z.array(ResourceSchema),
    sportsDetected: z
      .array(
        z.enum(["pickleball", "basketball", "badminton", "tennis", "unknown"]),
      )
      .optional(),
  }),
  blocks: z.array(BlockSchema),
  errors: z.array(ErrorSchema),
});

export type NormalizeOutput = z.infer<typeof OutputSchema>;
export type ExpectedBlock = z.infer<typeof BlockSchema>;
export type ExpectedError = z.infer<typeof ErrorSchema>;

// ---------------------------------------------------------------------------
// Expected output schema (what fixture -expected.json files contain)
// ---------------------------------------------------------------------------

export const ExpectedOutputSchema = z.object({
  meta: z
    .object({
      format: z.enum(["ics", "csv", "xlsx", "image"]).optional(),
      timeZoneFallback: z.string().optional(),
      isMultiCourt: z.boolean().optional(),
    })
    .optional(),
  blocks: z.array(
    z.object({
      resourceId: z.string().min(1),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      reason: z.string().nullable().optional(),
    }),
  ),
  errors: z
    .array(
      z.object({
        message: z.string().optional(),
        messageContains: z.string().optional(),
      }),
    )
    .optional(),
});

export type ExpectedOutput = z.infer<typeof ExpectedOutputSchema>;

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export const runNormalize = (args: string[]): NormalizeOutput => {
  const tsxPath = path.resolve(process.cwd(), "node_modules", ".bin", "tsx");
  const result = spawnSync(
    tsxPath,
    ["scripts/normalize-data.ts", "--", ...args],
    { encoding: "utf-8" },
  );

  if (result.status !== 0) {
    const errorText = result.stderr || result.stdout || "Unknown error";
    throw new Error(`normalize-data exited ${result.status}: ${errorText}`);
  }

  return OutputSchema.parse(JSON.parse(result.stdout));
};

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface CompareResult {
  pass: boolean;
  mismatches: string[];
}

export interface CompareRelaxedOptions {
  timeToleranceMinutes?: number;
  allowExtraBlocks?: boolean;
}

const sortBlocks = <T extends { resourceId: string; startTime: string }>(
  blocks: T[],
) =>
  [...blocks].sort((a, b) => {
    const r = a.resourceId.localeCompare(b.resourceId);
    if (r !== 0) return r;
    return a.startTime.localeCompare(b.startTime);
  });

export const compareStrict = (
  actual: NormalizeOutput,
  expected: ExpectedOutput,
): CompareResult => {
  const mismatches: string[] = [];

  // Compare meta if specified
  if (expected.meta) {
    if (expected.meta.format && actual.meta.format !== expected.meta.format) {
      mismatches.push(
        `meta.format: expected ${expected.meta.format}, got ${actual.meta.format}`,
      );
    }
    if (
      expected.meta.timeZoneFallback &&
      actual.meta.timeZoneFallback !== expected.meta.timeZoneFallback
    ) {
      mismatches.push(
        `meta.timeZoneFallback: expected ${expected.meta.timeZoneFallback}, got ${actual.meta.timeZoneFallback}`,
      );
    }
    if (
      expected.meta.isMultiCourt !== undefined &&
      actual.meta.isMultiCourt !== expected.meta.isMultiCourt
    ) {
      mismatches.push(
        `meta.isMultiCourt: expected ${expected.meta.isMultiCourt}, got ${actual.meta.isMultiCourt}`,
      );
    }
  }

  // Compare block count
  if (actual.blocks.length !== expected.blocks.length) {
    mismatches.push(
      `blocks.length: expected ${expected.blocks.length}, got ${actual.blocks.length}`,
    );
  }

  // Compare sorted blocks
  const actualSorted = sortBlocks(actual.blocks);
  const expectedSorted = sortBlocks(expected.blocks);

  const len = Math.min(actualSorted.length, expectedSorted.length);
  for (let i = 0; i < len; i++) {
    const a = actualSorted[i];
    const e = expectedSorted[i];
    const prefix = `block[${i}]`;

    if (a.resourceId !== e.resourceId) {
      mismatches.push(
        `${prefix}.resourceId: expected "${e.resourceId}", got "${a.resourceId}"`,
      );
    }
    if (a.startTime !== e.startTime) {
      mismatches.push(
        `${prefix}.startTime: expected "${e.startTime}", got "${a.startTime}"`,
      );
    }
    if (a.endTime !== e.endTime) {
      mismatches.push(
        `${prefix}.endTime: expected "${e.endTime}", got "${a.endTime}"`,
      );
    }
    if (e.reason !== undefined) {
      const actualReason = a.reason ?? null;
      const expectedReason = e.reason ?? null;
      if (actualReason !== expectedReason) {
        mismatches.push(
          `${prefix}.reason: expected "${expectedReason}", got "${actualReason}"`,
        );
      }
    }
  }

  // Compare errors
  const expectedErrors = expected.errors ?? [];
  if (expectedErrors.length > 0) {
    if (actual.errors.length !== expectedErrors.length) {
      mismatches.push(
        `errors.length: expected ${expectedErrors.length}, got ${actual.errors.length}`,
      );
    }
    for (let i = 0; i < expectedErrors.length; i++) {
      const exp = expectedErrors[i];
      const act = actual.errors[i];
      if (!act) continue;
      if (exp.messageContains) {
        if (!act.message.includes(exp.messageContains)) {
          mismatches.push(
            `errors[${i}].message: expected to contain "${exp.messageContains}", got "${act.message}"`,
          );
        }
      }
      if (exp.message) {
        if (act.message !== exp.message) {
          mismatches.push(
            `errors[${i}].message: expected "${exp.message}", got "${act.message}"`,
          );
        }
      }
    }
  } else if (actual.errors.length > 0) {
    mismatches.push(
      `errors: expected 0 errors, got ${actual.errors.length}: ${actual.errors.map((e) => e.message).join("; ")}`,
    );
  }

  return { pass: mismatches.length === 0, mismatches };
};

const parseDateMs = (value: string): number | null => {
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  return ms;
};

const withinTolerance = (
  actual: string,
  expected: string,
  toleranceMs: number,
): boolean => {
  const actualMs = parseDateMs(actual);
  const expectedMs = parseDateMs(expected);
  if (actualMs === null || expectedMs === null) return false;
  return Math.abs(actualMs - expectedMs) <= toleranceMs;
};

export const compareRelaxed = (
  actual: NormalizeOutput,
  expected: ExpectedOutput,
  options: CompareRelaxedOptions = {},
): CompareResult => {
  const mismatches: string[] = [];
  const toleranceMinutes = options.timeToleranceMinutes ?? 5;
  const toleranceMs = toleranceMinutes * 60 * 1000;
  const allowExtraBlocks = options.allowExtraBlocks ?? true;

  if (expected.meta) {
    if (expected.meta.format && actual.meta.format !== expected.meta.format) {
      mismatches.push(
        `meta.format: expected ${expected.meta.format}, got ${actual.meta.format}`,
      );
    }
    if (
      expected.meta.timeZoneFallback &&
      actual.meta.timeZoneFallback !== expected.meta.timeZoneFallback
    ) {
      mismatches.push(
        `meta.timeZoneFallback: expected ${expected.meta.timeZoneFallback}, got ${actual.meta.timeZoneFallback}`,
      );
    }
    if (
      expected.meta.isMultiCourt !== undefined &&
      actual.meta.isMultiCourt !== expected.meta.isMultiCourt
    ) {
      mismatches.push(
        `meta.isMultiCourt: expected ${expected.meta.isMultiCourt}, got ${actual.meta.isMultiCourt}`,
      );
    }
  }

  const unmatched = actual.blocks.map((block) => ({ block, used: false }));

  expected.blocks.forEach((expectedBlock, index) => {
    const matchedIndex = unmatched.findIndex(({ block, used }) => {
      if (used) return false;
      if (block.resourceId !== expectedBlock.resourceId) return false;
      if (
        !withinTolerance(block.startTime, expectedBlock.startTime, toleranceMs)
      ) {
        return false;
      }
      if (!withinTolerance(block.endTime, expectedBlock.endTime, toleranceMs)) {
        return false;
      }
      if (expectedBlock.reason !== undefined) {
        const actualReason = block.reason ?? null;
        const expectedReason = expectedBlock.reason ?? null;
        if (actualReason !== expectedReason) return false;
      }
      return true;
    });

    if (matchedIndex >= 0) {
      unmatched[matchedIndex].used = true;
      return;
    }

    mismatches.push(
      `block[${index}]: no match within ${toleranceMinutes} min for resourceId=${expectedBlock.resourceId}`,
    );
  });

  if (!allowExtraBlocks) {
    const extras = unmatched.filter((item) => !item.used);
    if (extras.length > 0) {
      mismatches.push(
        `blocks.length: expected ${expected.blocks.length}, got ${actual.blocks.length}`,
      );
    }
  }

  const expectedErrors = expected.errors ?? [];
  if (expectedErrors.length > 0) {
    if (actual.errors.length !== expectedErrors.length) {
      mismatches.push(
        `errors.length: expected ${expectedErrors.length}, got ${actual.errors.length}`,
      );
    }
    for (let i = 0; i < expectedErrors.length; i++) {
      const exp = expectedErrors[i];
      const act = actual.errors[i];
      if (!act) continue;
      if (exp.messageContains) {
        if (!act.message.includes(exp.messageContains)) {
          mismatches.push(
            `errors[${i}].message: expected to contain "${exp.messageContains}", got "${act.message}"`,
          );
        }
      }
      if (exp.message) {
        if (act.message !== exp.message) {
          mismatches.push(
            `errors[${i}].message: expected "${exp.message}", got "${act.message}"`,
          );
        }
      }
    }
  } else if (actual.errors.length > 0) {
    mismatches.push(
      `errors: expected 0 errors, got ${actual.errors.length}: ${actual.errors.map((e) => e.message).join("; ")}`,
    );
  }

  return { pass: mismatches.length === 0, mismatches };
};

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------

export interface Fixture {
  name: string;
  inputPath: string;
  format: "csv" | "ics" | "xlsx";
  mappingPath?: string;
  extractedPath?: string;
  expectedPath: string;
  expected: ExpectedOutput;
  extraArgs?: string[];
}

export interface DiscoverFixturesOptions {
  format?: Fixture["format"];
  includePromoted?: boolean;
}

export const discoverFixtures = (
  tierDir: string,
  options: DiscoverFixturesOptions = {},
): Fixture[] => {
  const fixtures: Fixture[] = [];
  const directories = [tierDir];

  if (options.includePromoted) {
    directories.push(path.join(tierDir, "promoted"));
  }

  for (const dir of directories) {
    let files: string[];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }

    const expectedFiles = files.filter((f) => f.endsWith("-expected.json"));
    const dirLabel = dir === tierDir ? "" : path.basename(dir);

    for (const expectedFile of expectedFiles) {
      const baseName = expectedFile.replace("-expected.json", "");
      const expectedPath = path.join(dir, expectedFile);
      const expected = ExpectedOutputSchema.parse(
        JSON.parse(readFileSync(expectedPath, "utf-8")),
      );

      const csvPath = path.join(dir, `${baseName}.csv`);
      const icsPath = path.join(dir, `${baseName}.ics`);
      const xlsxPath = path.join(dir, `${baseName}.xlsx`);

      let inputPath: string;
      let format: "csv" | "ics" | "xlsx";

      if (files.includes(`${baseName}.csv`)) {
        inputPath = csvPath;
        format = "csv";
      } else if (files.includes(`${baseName}.ics`)) {
        inputPath = icsPath;
        format = "ics";
      } else if (files.includes(`${baseName}.xlsx`)) {
        inputPath = xlsxPath;
        format = "xlsx";
      } else {
        process.stderr.write(
          `WARN: No input file found for fixture "${baseName}" in ${dir}\n`,
        );
        continue;
      }

      if (options.format && format !== options.format) {
        continue;
      }

      const mappingFile = `${baseName}-mapping.json`;
      const mappingPath = files.includes(mappingFile)
        ? path.join(dir, mappingFile)
        : undefined;

      const extractedFile = `${baseName}-extracted.json`;
      const extractedPath = files.includes(extractedFile)
        ? path.join(dir, extractedFile)
        : undefined;

      const argsFile = `${baseName}-args.json`;
      const extraArgs = files.includes(argsFile)
        ? (JSON.parse(
            readFileSync(path.join(dir, argsFile), "utf-8"),
          ) as string[])
        : undefined;

      fixtures.push({
        name: dirLabel ? `${dirLabel}/${baseName}` : baseName,
        inputPath,
        format,
        mappingPath,
        extractedPath,
        expectedPath,
        expected,
        extraArgs,
      });
    }
  }

  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
};

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

export interface TestResult {
  name: string;
  pass: boolean;
  blockCount: number;
  errorCount: number;
  mismatches: string[];
}

export const printSummary = (tierLabel: string, results: TestResult[]) => {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  process.stdout.write(`\n${"=".repeat(60)}\n`);
  process.stdout.write(
    `${tierLabel} RESULTS: ${passed} passed, ${failed} failed\n`,
  );
  process.stdout.write(`${"=".repeat(60)}\n\n`);

  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    const icon = r.pass ? "\u2713" : "\u2717";
    process.stdout.write(
      `  ${icon} [${status}] ${r.name} (${r.blockCount} blocks, ${r.errorCount} errors)\n`,
    );
    if (!r.pass) {
      for (const m of r.mismatches) {
        process.stdout.write(`      - ${m}\n`);
      }
    }
  }

  process.stdout.write("\n");

  if (failed > 0) {
    process.exit(1);
  }
};
