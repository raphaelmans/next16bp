import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  buildHeaderLookup,
  resolveHeader,
  type TabularDataset,
  type TabularRow,
} from "./csv-parser";
import { buildLocalDateTime, parseDateTimeValue } from "./datetime-parser";

export type TabularFormat = "csv" | "xlsx";

const TabularDateTimeModeSchema = z.enum([
  "start_end_datetime",
  "date_start_end_time",
  "date_start_time_duration_min",
]);

const ColumnRefSchema = z.object({
  header: z.string().min(1),
});

const ResourceSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("column"), column: ColumnRefSchema }),
  z.object({ kind: z.literal("constant"), value: z.string().min(1) }),
  z.object({ kind: z.literal("none") }),
]);

const ReasonSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("column"), column: ColumnRefSchema }),
  z.object({ kind: z.literal("none") }),
]);

const TabularMappingHintSchema = z.object({
  dateTimeMode: TabularDateTimeModeSchema,
  resourceColumn: z.string().optional().nullable(),
  startDateTimeColumn: z.string().optional().nullable(),
  endDateTimeColumn: z.string().optional().nullable(),
  startDateColumn: z.string().optional().nullable(),
  startTimeColumn: z.string().optional().nullable(),
  endDateColumn: z.string().optional().nullable(),
  endTimeColumn: z.string().optional().nullable(),
  durationMinutesColumn: z.string().optional().nullable(),
  reasonColumn: z.string().optional().nullable(),
});

const TabularMappingHintResponseSchema = z.object({
  mapping: TabularMappingHintSchema,
});

const TabularMappingSpecSchema = z
  .object({
    format: z.enum(["csv", "xlsx"]),
    version: z.literal(1),
    dateTimeMode: TabularDateTimeModeSchema,
    resource: ResourceSourceSchema,
    reason: ReasonSourceSchema.default({ kind: "none" }),
    start: z
      .object({
        datetime: ColumnRefSchema.optional(),
        date: ColumnRefSchema.optional(),
        time: ColumnRefSchema.optional(),
      })
      .default({}),
    end: z
      .object({
        datetime: ColumnRefSchema.optional(),
        date: ColumnRefSchema.optional(),
        time: ColumnRefSchema.optional(),
        durationMinutes: ColumnRefSchema.optional(),
      })
      .default({}),
    parsing: z.object({
      timeZoneFallback: z.string().min(1),
      dateOrder: z.enum(["ymd", "mdy", "dmy"]).default("ymd"),
      timeFormat: z.enum(["24h", "12h"]).default("24h"),
      assumeTimeZoneWhenMissingOffset: z.boolean().default(true),
    }),
  })
  .superRefine((spec, ctx) => {
    const require = (ok: boolean, message: string) => {
      if (!ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    };

    if (spec.dateTimeMode === "start_end_datetime") {
      require(!!spec.start
        .datetime, "start.datetime is required for start_end_datetime");
      require(!!spec.end
        .datetime, "end.datetime is required for start_end_datetime");
    }

    if (spec.dateTimeMode === "date_start_end_time") {
      require(!!spec.start.date &&
        !!spec.start
          .time, "start.date and start.time are required for date_start_end_time");
      require(!!spec.end.date &&
        !!spec.end
          .time, "end.date and end.time are required for date_start_end_time");
    }

    if (spec.dateTimeMode === "date_start_time_duration_min") {
      require(!!spec.start.date &&
        !!spec.start
          .time, "start.date and start.time are required for date_start_time_duration_min");
      require(!!spec.end
        .durationMinutes, "end.durationMinutes is required for date_start_time_duration_min");
    }
  });

export type TabularMappingSpec = z.infer<typeof TabularMappingSpecSchema>;

export type TabularParsedRow = {
  rowNumber: number;
  courtLabel: string | null;
  startTime: Date | null;
  endTime: Date | null;
  reason: string | null;
  sourceData: Record<string, string>;
};

const DEFAULT_TABULAR_MODEL = "gpt-5.2";

const buildTabularMappingPrompt = (input: {
  format: TabularFormat;
  timeZoneFallback: string;
  headers: string[];
  sampleRows: Record<string, string>[];
}) =>
  [
    "Return ONLY JSON. No markdown, no comments.",
    "The JSON must be an object with a top-level key named 'mapping'.",
    "Goal: map external booking exports into reservation blocks.",
    "Select dateTimeMode that best matches the columns.",
    "For dateTimeMode=start_end_datetime: provide startDateTimeColumn and endDateTimeColumn.",
    "For dateTimeMode=date_start_end_time: provide startDateColumn, startTimeColumn, endDateColumn, endTimeColumn.",
    "For dateTimeMode=date_start_time_duration_min: provide startDateColumn, startTimeColumn, durationMinutesColumn.",
    "Set resourceColumn to the court/resource header when possible.",
    "If no court/resource column exists, omit resourceColumn.",
    "reasonColumn is optional.",
    "",
    "INPUT:",
    JSON.stringify(input, null, 2),
  ].join("\n");

const resolveColumnValue = (
  row: TabularRow,
  headerLookup: Map<string, string>,
  columnHeader: string | undefined,
): string => {
  if (!columnHeader) return "";
  const resolved = resolveHeader(headerLookup, columnHeader);
  if (!resolved) return "";
  return row.data[resolved] ?? "";
};

const validateTabularMapping = (
  spec: TabularMappingSpec,
  headers: string[],
) => {
  const lookup = buildHeaderLookup(headers);
  const assertColumn = (column?: { header: string }) => {
    if (!column) return;
    if (!resolveHeader(lookup, column.header)) {
      throw new Error(`Missing column in input: ${column.header}`);
    }
  };

  if (spec.resource.kind === "column") {
    assertColumn(spec.resource.column);
  }
  if (spec.reason.kind === "column") {
    assertColumn(spec.reason.column);
  }

  assertColumn(spec.start.datetime);
  assertColumn(spec.start.date);
  assertColumn(spec.start.time);
  assertColumn(spec.end.datetime);
  assertColumn(spec.end.date);
  assertColumn(spec.end.time);
  assertColumn(spec.end.durationMinutes);
};

export async function generateTabularMappingSpec(params: {
  dataset: TabularDataset;
  timeZone: string;
  format: TabularFormat;
  model?: string;
}): Promise<TabularMappingSpec> {
  const { dataset, timeZone, format, model = DEFAULT_TABULAR_MODEL } = params;
  const sampleRows = dataset.rows.slice(0, 20).map((row) => row.data);

  const { object } = await generateObject({
    model: openai(model),
    schema: TabularMappingHintResponseSchema,
    system: "You are a data extraction engine. Return JSON only.",
    prompt: buildTabularMappingPrompt({
      format,
      timeZoneFallback: timeZone,
      headers: dataset.headers,
      sampleRows,
    }),
  });

  const hint = object.mapping;
  const resourceColumn = hint.resourceColumn?.trim();
  const reasonColumn = hint.reasonColumn?.trim();

  const resource = resourceColumn
    ? { kind: "column", column: { header: resourceColumn } }
    : { kind: "constant", value: "Court 1" };
  const reason = reasonColumn
    ? { kind: "column", column: { header: reasonColumn } }
    : { kind: "none" };

  return TabularMappingSpecSchema.parse({
    format,
    version: 1,
    dateTimeMode: hint.dateTimeMode,
    resource,
    reason,
    start: {
      datetime: hint.startDateTimeColumn
        ? { header: hint.startDateTimeColumn }
        : undefined,
      date: hint.startDateColumn ? { header: hint.startDateColumn } : undefined,
      time: hint.startTimeColumn ? { header: hint.startTimeColumn } : undefined,
    },
    end: {
      datetime: hint.endDateTimeColumn
        ? { header: hint.endDateTimeColumn }
        : undefined,
      date: hint.endDateColumn ? { header: hint.endDateColumn } : undefined,
      time: hint.endTimeColumn ? { header: hint.endTimeColumn } : undefined,
      durationMinutes: hint.durationMinutesColumn
        ? { header: hint.durationMinutesColumn }
        : undefined,
    },
    parsing: {
      timeZoneFallback: timeZone,
      dateOrder: "ymd",
      timeFormat: "24h",
      assumeTimeZoneWhenMissingOffset: true,
    },
  });
}

export function buildTabularRowsFromSpec(params: {
  dataset: TabularDataset;
  spec: TabularMappingSpec;
  timeZone: string;
}): TabularParsedRow[] {
  const { dataset, spec, timeZone } = params;
  validateTabularMapping(spec, dataset.headers);

  const headerLookup = buildHeaderLookup(dataset.headers);
  const rows: TabularParsedRow[] = [];

  const parsing = {
    timeZone,
    dateOrder: spec.parsing.dateOrder,
    timeFormat: spec.parsing.timeFormat,
    assumeLocal: spec.parsing.assumeTimeZoneWhenMissingOffset,
  };

  for (const row of dataset.rows) {
    let resourceLabel = "";
    if (spec.resource.kind === "column") {
      resourceLabel = resolveColumnValue(
        row,
        headerLookup,
        spec.resource.column.header,
      );
    } else if (spec.resource.kind === "constant") {
      resourceLabel = spec.resource.value;
    }

    let reason: string | null = null;
    if (spec.reason.kind === "column") {
      reason =
        resolveColumnValue(row, headerLookup, spec.reason.column.header) ||
        null;
    }

    let start: Date | null = null;
    let end: Date | null = null;

    if (spec.dateTimeMode === "start_end_datetime") {
      const startValue = resolveColumnValue(
        row,
        headerLookup,
        spec.start.datetime?.header,
      );
      const endValue = resolveColumnValue(
        row,
        headerLookup,
        spec.end.datetime?.header,
      );
      start = parseDateTimeValue(startValue, parsing);
      end = parseDateTimeValue(endValue, parsing);
    }

    if (spec.dateTimeMode === "date_start_end_time") {
      const dateValue = resolveColumnValue(
        row,
        headerLookup,
        spec.start.date?.header,
      );
      const startTimeValue = resolveColumnValue(
        row,
        headerLookup,
        spec.start.time?.header,
      );
      const endDateValue = resolveColumnValue(
        row,
        headerLookup,
        spec.end.date?.header,
      );
      const endTimeValue = resolveColumnValue(
        row,
        headerLookup,
        spec.end.time?.header,
      );

      start = buildLocalDateTime(dateValue, startTimeValue, parsing);
      end = buildLocalDateTime(endDateValue, endTimeValue, parsing);
    }

    if (spec.dateTimeMode === "date_start_time_duration_min") {
      const dateValue = resolveColumnValue(
        row,
        headerLookup,
        spec.start.date?.header,
      );
      const startTimeValue = resolveColumnValue(
        row,
        headerLookup,
        spec.start.time?.header,
      );
      const durationValue = resolveColumnValue(
        row,
        headerLookup,
        spec.end.durationMinutes?.header,
      );
      const durationMinutes = Number.parseInt(durationValue, 10);

      start = buildLocalDateTime(dateValue, startTimeValue, parsing);
      if (start && Number.isFinite(durationMinutes)) {
        end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      }
    }

    rows.push({
      rowNumber: row.rowNumber,
      courtLabel: resourceLabel.trim() || null,
      startTime: start,
      endTime: end,
      reason: reason?.trim() || null,
      sourceData: row.data,
    });
  }

  return rows;
}
