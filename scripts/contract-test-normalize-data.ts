import { spawnSync } from "node:child_process";
import path from "node:path";
import { z } from "zod";
import { getZonedDate } from "../src/common/time-zone";
import { CreateCourtBlockSchema } from "../src/lib/modules/court-block/dtos/create-court-block.dto";

type FixtureCommand = {
  name: string;
  args: string[];
};

const OutputSchema = z.object({
  meta: z.object({
    format: z.string(),
    timeZoneFallback: z.string(),
    resources: z.array(
      z.object({
        resourceId: z.string().min(1),
        label: z.string().min(1),
      }),
    ),
  }),
  blocks: z.array(
    z.object({
      resourceId: z.string().min(1),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      reason: z.string().nullable().optional(),
    }),
  ),
  errors: z.array(
    z.object({
      message: z.string().min(1),
    }),
  ),
});

const ResourceMapSchema = z.record(z.string(), z.string().uuid());

const RESOURCE_MAP_PATH = "scripts/fixtures/normalize-data/resource-map.json";

const fixtures: FixtureCommand[] = [
  {
    name: "csv-ai",
    args: [
      "--format=csv",
      "--path=scripts/fixtures/normalize-data/booking-multi-court.csv",
      "--mapping-file=scripts/fixtures/normalize-data/booking-multi-court-ai-mapping.json",
      "--no-ai",
    ],
  },
  {
    name: "xlsx-ai",
    args: [
      "--format=xlsx",
      "--path=scripts/fixtures/normalize-data/booking-ai.xlsx",
      "--mapping-file=scripts/fixtures/normalize-data/booking-ai-xlsx-mapping.json",
      "--no-ai",
    ],
  },
  {
    name: "ics-ai",
    args: [
      "--format=ics",
      "--path=scripts/fixtures/normalize-data/booking-ai.ics",
      "--range-start=2025-05-01T00:00:00Z",
      "--range-end=2025-05-31T23:59:59Z",
      "--mapping-file=scripts/fixtures/normalize-data/booking-ai-ics-mapping.json",
      "--no-ai",
    ],
  },
  {
    name: "image-ai",
    args: [
      "--format=image",
      "--path=scripts/fixtures/normalize-data/calendar-screenshot.jpeg",
      "--extracted-file=scripts/fixtures/normalize-data/calendar-screenshot-extracted.json",
      "--no-ai",
    ],
  },
];

const runNormalize = (args: string[]) => {
  const tsxPath = path.resolve(process.cwd(), "node_modules", ".bin", "tsx");
  const result = spawnSync(
    tsxPath,
    ["scripts/normalize-data.ts", "--", ...args],
    { encoding: "utf-8" },
  );

  if (result.status !== 0) {
    const errorText = result.stderr || result.stdout || "Unknown error";
    throw new Error(errorText);
  }

  return JSON.parse(result.stdout) as unknown;
};

const validateHourAlignment = (timeZone: string, start: Date, end: Date) => {
  const startLocal = getZonedDate(start, timeZone);
  const endLocal = getZonedDate(end, timeZone);
  if (startLocal.getMinutes() !== 0 || startLocal.getSeconds() !== 0) {
    return false;
  }
  if (endLocal.getMinutes() !== 0 || endLocal.getSeconds() !== 0) {
    return false;
  }
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  return Number.isFinite(durationMinutes) && durationMinutes % 60 === 0;
};

const main = async () => {
  const resourceMap = ResourceMapSchema.parse(
    JSON.parse(
      await import("node:fs/promises").then(({ readFile }) =>
        readFile(RESOURCE_MAP_PATH, "utf-8"),
      ),
    ),
  );

  const results: Array<{ name: string; count: number }> = [];

  for (const fixture of fixtures) {
    const output = OutputSchema.parse(runNormalize(fixture.args));

    if (output.errors.length > 0) {
      throw new Error(
        `${fixture.name}: output contains ${output.errors.length} errors`,
      );
    }

    const timeZone = output.meta.timeZoneFallback;

    for (const block of output.blocks) {
      const courtId = resourceMap[block.resourceId];
      if (!courtId) {
        throw new Error(
          `${fixture.name}: missing courtId mapping for ${block.resourceId}`,
        );
      }

      CreateCourtBlockSchema.parse({
        courtId,
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason ?? undefined,
      });

      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      if (!validateHourAlignment(timeZone, start, end)) {
        throw new Error(
          `${fixture.name}: block is not hour-aligned (${block.startTime} -> ${block.endTime})`,
        );
      }
    }

    results.push({ name: fixture.name, count: output.blocks.length });
  }

  const summary = results
    .map((item) => `${item.name}: ${item.count}`)
    .join(" | ");
  process.stdout.write(`Contract OK (${summary})\n`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
