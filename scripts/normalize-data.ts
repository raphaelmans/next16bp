import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openai } from "@ai-sdk/openai";
import { TZDate } from "@date-fns/tz";
import { generateObject } from "ai";
import { addDays } from "date-fns";
import IcalExpander from "ical-expander";
import xlsx from "xlsx";
import { z } from "zod";
import { getZonedDate, toUtcISOString } from "../src/common/time-zone";

type InputFormat = "csv" | "xlsx" | "ics" | "image";

const isInputFormat = (value: string): value is InputFormat =>
  value === "csv" || value === "xlsx" || value === "ics" || value === "image";

interface NormalizeOptions {
  filePath: string;
  format: InputFormat;
  timeZone: string;
  rangeStart: Date;
  rangeEnd: Date;
  model: string;
  mappingFile?: string;
  saveMappingFile?: string;
  extractedFile?: string;
  saveExtractedFile?: string;
  noAi: boolean;
}

interface TabularRow {
  rowNumber: number;
  data: Record<string, string>;
}

interface TabularDataset {
  headers: string[];
  rows: TabularRow[];
}

interface IcsOccurrence {
  start: Date;
  end: Date;
  summary?: string;
  location?: string;
  description?: string;
  uid?: string;
  status?: string;
  isAllDay: boolean;
}

type SportSlug =
  | "pickleball"
  | "basketball"
  | "badminton"
  | "tennis"
  | "unknown";

const SUPPORTED_SPORTS: SportSlug[] = [
  "pickleball",
  "basketball",
  "badminton",
  "tennis",
  "unknown",
];

const ColumnRefSchema = z.object({
  header: z.string().min(1),
});

const ResourceSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("column"), column: ColumnRefSchema }),
  z.object({ kind: z.literal("constant"), value: z.string().min(1) }),
  z.object({ kind: z.literal("none") }),
]);

const SportSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("column"), column: ColumnRefSchema }),
  z.object({ kind: z.literal("infer") }),
  z.object({ kind: z.literal("none") }),
]);

const ReasonSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("column"), column: ColumnRefSchema }),
  z.object({ kind: z.literal("none") }),
]);

const DateOrderSchema = z.enum(["ymd", "mdy", "dmy"]);
const TimeFormatSchema = z.enum(["24h", "12h"]);
const TabularDateTimeModeSchema = z.enum([
  "start_end_datetime",
  "date_start_end_time",
  "date_start_time_duration_min",
]);

const TabularMappingHintSchema = z.object({
  dateTimeMode: TabularDateTimeModeSchema,
  resourceColumn: z.string().optional(),
  startDateTimeColumn: z.string().optional(),
  endDateTimeColumn: z.string().optional(),
  startDateColumn: z.string().optional(),
  startTimeColumn: z.string().optional(),
  endDateColumn: z.string().optional(),
  endTimeColumn: z.string().optional(),
  durationMinutesColumn: z.string().optional(),
  reasonColumn: z.string().optional(),
  sportColumn: z.string().optional(),
});

const TabularMappingSpecSchema = z
  .object({
    format: z.enum(["csv", "xlsx"]),
    version: z.literal(1),
    sheetName: z.string().min(1).optional(),
    dateTimeMode: TabularDateTimeModeSchema,
    resource: ResourceSourceSchema,
    sport: SportSourceSchema.default({ kind: "infer" }),
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
      dateOrder: DateOrderSchema.default("ymd"),
      timeFormat: TimeFormatSchema.default("24h"),
      assumeTimeZoneWhenMissingOffset: z.boolean().default(true),
    }),
  })
  .superRefine((spec, ctx) => {
    const need = (ok: boolean, message: string) => {
      if (!ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    };

    if (spec.dateTimeMode === "start_end_datetime") {
      need(
        !!spec.start.datetime,
        "start.datetime is required for start_end_datetime",
      );
      need(
        !!spec.end.datetime,
        "end.datetime is required for start_end_datetime",
      );
    }

    if (spec.dateTimeMode === "date_start_end_time") {
      need(
        !!spec.start.date && !!spec.start.time,
        "start.date and start.time are required for date_start_end_time",
      );
      need(
        !!spec.end.date && !!spec.end.time,
        "end.date and end.time are required for date_start_end_time",
      );
    }

    if (spec.dateTimeMode === "date_start_time_duration_min") {
      need(
        !!spec.start.date && !!spec.start.time,
        "start.date and start.time are required for date_start_time_duration_min",
      );
      need(
        !!spec.end.durationMinutes,
        "end.durationMinutes is required for date_start_time_duration_min",
      );
    }
  });

const IcsSportSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("infer") }),
  z.object({ kind: z.literal("none") }),
]);

const IcsMappingSpecSchema = z.object({
  format: z.literal("ics"),
  version: z.literal(1),
  resource: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("location") }),
    z.object({ kind: z.literal("summary") }),
    z.object({ kind: z.literal("description") }),
    z.object({ kind: z.literal("constant"), value: z.string().min(1) }),
    z.object({ kind: z.literal("none") }),
  ]),
  reason: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("summary") }),
    z.object({ kind: z.literal("description") }),
    z.object({ kind: z.literal("none") }),
  ]),
  sport: IcsSportSourceSchema.default({ kind: "infer" }),
  parsing: z.object({
    timeZoneFallback: z.string().min(1),
    ignoreCancelled: z.boolean().default(true),
    ignoreAllDay: z.boolean().default(true),
  }),
});

const IcsMappingHintSchema = z.object({
  resourceKind: z.enum([
    "location",
    "summary",
    "description",
    "constant",
    "none",
  ]),
  resourceValue: z.string().optional(),
  reasonKind: z.enum(["summary", "description", "none"]),
  sportKind: z.enum(["infer", "none"]).default("infer"),
  ignoreCancelled: z.boolean().default(true),
  ignoreAllDay: z.boolean().default(true),
});

const NormalizationMappingSpecSchema = z.discriminatedUnion("format", [
  TabularMappingSpecSchema,
  IcsMappingSpecSchema,
]);

const TabularMappingHintResponseSchema = z.object({
  mapping: TabularMappingHintSchema,
});

const IcsMappingHintResponseSchema = z.object({
  mapping: IcsMappingHintSchema,
});

const ScreenshotExtractionSchema = z.object({
  calendarTitle: z.string().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  timeZone: z.string().optional(),
  events: z.array(
    z.object({
      day: z.number().int().min(1).max(31),
      startTime: z.string().min(1),
      title: z.string().optional(),
      resourceLabel: z.string().optional(),
    }),
  ),
});

const ResourceSchema = z.object({
  resourceId: z.string().min(1),
  label: z.string().min(1),
  sport: z.enum(SUPPORTED_SPORTS).optional(),
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
  format: z.enum(["ics", "csv", "xlsx", "image"]),
  row: z.number().int().positive().optional(),
  uid: z.string().optional(),
});

const OutputSchema = z.object({
  meta: z.object({
    format: z.enum(["ics", "csv", "xlsx", "image"]),
    timeZoneFallback: z.string().min(1),
    isMultiCourt: z.boolean(),
    resources: z.array(ResourceSchema),
    sportsDetected: z.array(z.enum(SUPPORTED_SPORTS)),
  }),
  blocks: z.array(BlockSchema),
  errors: z.array(ErrorSchema),
});

const DEFAULT_TIME_ZONE = "Asia/Manila";
const DEFAULT_MODEL = "gpt-5.2";
const DEFAULT_RANGE_DAYS = 60;

const parseArgs = (): NormalizeOptions => {
  const args = process.argv.slice(2);
  const options: NormalizeOptions = {
    filePath: "",
    format: "csv",
    timeZone: DEFAULT_TIME_ZONE,
    rangeStart: new Date(),
    rangeEnd: addDays(new Date(), DEFAULT_RANGE_DAYS),
    model: DEFAULT_MODEL,
    extractedFile: undefined,
    saveExtractedFile: undefined,
    noAi: false,
  };
  let formatProvided = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--") {
      continue;
    }

    if (arg === "--no-ai") {
      options.noAi = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.split("=");
      const value = inlineValue ?? args[i + 1];

      if (!inlineValue && args[i + 1] && !args[i + 1].startsWith("--")) {
        i += 1;
      }

      switch (key) {
        case "--path":
          options.filePath = value ?? "";
          continue;
        case "--format":
          if (!value) {
            throw new Error("--format requires a value (csv|xlsx|ics|image)");
          }
          if (!isInputFormat(value)) {
            throw new Error(`Unsupported --format value: ${value}`);
          }
          options.format = value;
          formatProvided = true;
          continue;
        case "--time-zone":
          options.timeZone = value ?? DEFAULT_TIME_ZONE;
          continue;
        case "--range-start":
          if (value) {
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
              throw new Error("--range-start must be a valid datetime string");
            }
            options.rangeStart = parsed;
          }
          continue;
        case "--range-end":
          if (value) {
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
              throw new Error("--range-end must be a valid datetime string");
            }
            options.rangeEnd = parsed;
          }
          continue;
        case "--model":
          options.model = value ?? DEFAULT_MODEL;
          continue;
        case "--mapping-file":
          options.mappingFile = value ?? undefined;
          continue;
        case "--save-mapping-file":
          options.saveMappingFile = value ?? undefined;
          continue;
        case "--extracted-file":
          options.extractedFile = value ?? undefined;
          continue;
        case "--save-extracted-file":
          options.saveExtractedFile = value ?? undefined;
          continue;
        default:
          throw new Error(`Unknown argument: ${arg}`);
      }
    }
  }

  if (!options.filePath) {
    throw new Error("--path is required");
  }

  if (!formatProvided) {
    throw new Error("--format is required (csv|xlsx|ics|image)");
  }

  return options;
};

const warnOnFormatMismatch = (filePath: string, format: InputFormat) => {
  const ext = path.extname(filePath).toLowerCase();
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  if (!ext) return;
  if (format === "image") {
    if (!imageExtensions.has(ext)) {
      process.stderr.write(
        `Warning: file extension (${ext}) does not match --format=image\n`,
      );
    }
    return;
  }

  const expected = `.${format}`;
  if (ext !== expected) {
    process.stderr.write(
      `Warning: file extension (${ext}) does not match --format=${format}\n`,
    );
  }
};

const normalizeHeader = (value: string) => value.trim().toLowerCase();

const buildHeaderLookup = (headers: string[]) => {
  const map = new Map<string, string>();
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    if (!normalized) continue;
    if (!map.has(normalized)) {
      map.set(normalized, header);
    }
  }
  return map;
};

const resolveHeader = (
  headerLookup: Map<string, string>,
  header: string,
): string | null => {
  const normalized = normalizeHeader(header);
  return headerLookup.get(normalized) ?? null;
};

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        const next = content[i + 1];
        if (next === '"') {
          value += '"';
          i += 1;
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
};

const buildTabularDataset = (rows: string[][]): TabularDataset => {
  if (rows.length === 0) {
    throw new Error("No rows found in file");
  }

  const headers = rows[0].map((header) => header.trim());
  if (!headers.some((header) => header.length > 0)) {
    throw new Error("Header row is empty");
  }

  const dataRows: TabularRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const record: Record<string, string> = {};
    for (let col = 0; col < headers.length; col += 1) {
      const header = headers[col];
      if (!header) {
        continue;
      }
      const cell = row[col] ?? "";
      record[header] = String(cell).trim();
    }
    dataRows.push({ rowNumber: i + 1, data: record });
  }

  return { headers, rows: dataRows };
};

const parseXlsx = (buffer: Buffer, sheetName?: string): TabularDataset => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const resolvedSheetName = sheetName ?? workbook.SheetNames[0];
  if (!resolvedSheetName) {
    throw new Error("XLSX has no sheets to parse");
  }
  const sheet = workbook.Sheets[resolvedSheetName];
  if (!sheet) {
    throw new Error(`XLSX sheet not found: ${resolvedSheetName}`);
  }

  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const rows = (rawRows as unknown[][]).map((row: unknown[]) =>
    row.map((cell: unknown) => String(cell ?? "")),
  );

  return buildTabularDataset(rows);
};

const toJsDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (!value || typeof value !== "object") return null;
  if ("toJSDate" in value && typeof value.toJSDate === "function") {
    const result = value.toJSDate();
    return result instanceof Date ? result : null;
  }
  return null;
};

const getEventString = (item: unknown, key: string): string | undefined => {
  if (!item || typeof item !== "object") return undefined;
  const record = item as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string") return direct;
  const lower = record[key.toLowerCase()];
  if (typeof lower === "string") return lower;
  const getter = record.getFirstPropertyValue;
  if (typeof getter === "function") {
    const value = getter.call(record, key);
    if (typeof value === "string") return value;
  }
  return undefined;
};

const isAllDayValue = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  if ("isDate" in value && value.isDate === true) return true;
  return false;
};

const parseIcs = (
  content: string,
  rangeStart: Date,
  rangeEnd: Date,
): IcsOccurrence[] => {
  const expander = new IcalExpander({ ics: content, maxIterations: 10000 });
  const { events, occurrences } = expander.between(rangeStart, rangeEnd);
  const results: IcsOccurrence[] = [];

  for (const entry of events) {
    const item = entry.item ?? entry;
    const startValue = entry.startDate ?? item?.startDate ?? item?.startTime;
    const endValue = entry.endDate ?? item?.endDate ?? item?.endTime;
    const start = toJsDate(startValue);
    const end = toJsDate(endValue);
    if (!start || !end) continue;

    results.push({
      start,
      end,
      summary: getEventString(item, "summary"),
      location: getEventString(item, "location"),
      description: getEventString(item, "description"),
      uid: getEventString(item, "uid"),
      status: getEventString(item, "status"),
      isAllDay: isAllDayValue(startValue) || isAllDayValue(endValue),
    });
  }

  for (const occurrence of occurrences) {
    const item = occurrence.item ?? occurrence;
    const startValue =
      occurrence.startDate ?? item?.startDate ?? item?.startTime;
    const endValue = occurrence.endDate ?? item?.endDate ?? item?.endTime;
    const start = toJsDate(startValue);
    const end = toJsDate(endValue);
    if (!start || !end) continue;

    results.push({
      start,
      end,
      summary: getEventString(item, "summary"),
      location: getEventString(item, "location"),
      description: getEventString(item, "description"),
      uid: getEventString(item, "uid"),
      status: getEventString(item, "status"),
      isAllDay: isAllDayValue(startValue) || isAllDayValue(endValue),
    });
  }

  return results;
};

const hasExplicitOffset = (value: string) =>
  /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);

const parseDatePart = (
  value: string,
  order: z.infer<typeof DateOrderSchema>,
) => {
  const cleaned = value.trim();
  const parts = cleaned.split(/[-/.]/).map((part) => part.trim());
  if (parts.length !== 3) return null;
  if (!parts.every((part) => part.length > 0)) return null;

  let year: number;
  let month: number;
  let day: number;

  if (parts[0].length === 4) {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (order === "mdy") {
    month = Number(parts[0]);
    day = Number(parts[1]);
    year = Number(parts[2]);
  } else if (order === "dmy") {
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  }

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
};

const parseTimePart = (
  value: string,
  timeFormat: z.infer<typeof TimeFormatSchema>,
) => {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  const match = cleaned.match(
    /^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/,
  );
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[4];

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  if (meridiem) {
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  } else if (timeFormat === "12h" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
};

const parseImageTime = (
  value: string,
): { hour: number; minute: number } | null => {
  const parsed24 = parseTimePart(value, "24h");
  if (parsed24) return parsed24;
  const parsed12 = parseTimePart(value, "12h");
  if (parsed12) return parsed12;
  const match = value.match(/(\d{1,2}:\d{2})/);
  if (match) {
    return parseTimePart(match[1], "24h") ?? parseTimePart(match[1], "12h");
  }
  return null;
};

const buildLocalDateTime = (
  dateValue: string,
  timeValue: string,
  options: {
    timeZone: string;
    dateOrder: z.infer<typeof DateOrderSchema>;
    timeFormat: z.infer<typeof TimeFormatSchema>;
  },
) => {
  const date = parseDatePart(dateValue, options.dateOrder);
  const time = parseTimePart(timeValue, options.timeFormat);
  if (!date || !time) return null;
  return new TZDate(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
    options.timeZone,
  );
};

const parseDateTimeValue = (
  value: string,
  options: {
    timeZone: string;
    dateOrder: z.infer<typeof DateOrderSchema>;
    timeFormat: z.infer<typeof TimeFormatSchema>;
    assumeLocal: boolean;
  },
): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (hasExplicitOffset(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (!options.assumeLocal) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const separatorIndex = trimmed.includes("T")
    ? trimmed.indexOf("T")
    : trimmed.indexOf(" ");
  if (separatorIndex === -1) return null;

  const datePart = trimmed.slice(0, separatorIndex);
  const timePart = trimmed.slice(separatorIndex + 1);

  return buildLocalDateTime(datePart, timePart, {
    timeZone: options.timeZone,
    dateOrder: options.dateOrder,
    timeFormat: options.timeFormat,
  });
};

const isHourAligned = (instant: Date, timeZone: string) => {
  const zoned = getZonedDate(instant, timeZone);
  return zoned.getMinutes() === 0 && zoned.getSeconds() === 0;
};

const inferSportFromText = (text: string): SportSlug => {
  const value = text.toLowerCase();
  if (value.includes("pickle")) return "pickleball";
  if (value.includes("basket")) return "basketball";
  if (value.includes("badminton")) return "badminton";
  if (value.includes("tennis")) return "tennis";
  return "unknown";
};

const resolveSportValue = (value: string | null | undefined): SportSlug => {
  if (!value) return "unknown";
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("pickle")) return "pickleball";
  if (normalized.includes("basket")) return "basketball";
  if (normalized.includes("badminton")) return "badminton";
  if (normalized.includes("tennis")) return "tennis";
  return "unknown";
};

const buildPrompt = (input: {
  format: InputFormat;
  timeZoneFallback: string;
  headers?: string[];
  sampleRows?: Record<string, string>[];
  sampleEvents?: Array<Record<string, string | null | undefined>>;
}) => {
  const formatHint =
    input.format === "ics"
      ? "For ICS, choose resource from location/summary/description or constant."
      : "For CSV/XLSX, map resource and start/end columns based on headers.";

  const formatSchema =
    input.format === "ics"
      ? [
          "mapping fields:",
          "- resourceKind: location|summary|description|constant|none",
          "- resourceValue: string (required if resourceKind=constant)",
          "- reasonKind: summary|description|none",
          "- sportKind: infer|none",
          "- ignoreCancelled: boolean",
          "- ignoreAllDay: boolean",
        ].join(" ")
      : [
          "mapping fields:",
          "- dateTimeMode: start_end_datetime|date_start_end_time|date_start_time_duration_min",
          "- resourceColumn: header name for court/resource",
          "- startDateTimeColumn / endDateTimeColumn (for start_end_datetime)",
          "- startDateColumn + startTimeColumn + endDateColumn + endTimeColumn (for date_start_end_time)",
          "- startDateColumn + startTimeColumn + durationMinutesColumn (for date_start_time_duration_min)",
          "- reasonColumn (optional)",
          "- sportColumn (optional)",
        ].join(" ");

  return [
    "Return ONLY JSON. No markdown, no comments.",
    "The JSON must be an object with a top-level key named 'mapping'.",
    "Goal: map external booking exports into reservation blocks.",
    formatHint,
    formatSchema,
    "If no court/resource column is present, use resourceKind=constant and resourceValue='Court 1'.",
    `Allowed sports: ${SUPPORTED_SPORTS.join(", ")}.`,
    "",
    "INPUT:",
    JSON.stringify(input, null, 2),
  ].join("\n");
};

const loadMappingSpec = async (filePath: string) => {
  const content = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(content) as unknown;
  return NormalizationMappingSpecSchema.parse(parsed);
};

const saveMappingSpec = async (filePath: string, mappingSpec: unknown) => {
  const resolved = path.resolve(process.cwd(), filePath);
  const payload = JSON.stringify(mappingSpec, null, 2);
  await writeFile(resolved, payload, "utf-8");
};

const validateTabularMapping = (
  spec: z.infer<typeof TabularMappingSpecSchema>,
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
  if (spec.sport.kind === "column") {
    assertColumn(spec.sport.column);
  }

  assertColumn(spec.start.datetime);
  assertColumn(spec.start.date);
  assertColumn(spec.start.time);
  assertColumn(spec.end.datetime);
  assertColumn(spec.end.date);
  assertColumn(spec.end.time);
  assertColumn(spec.end.durationMinutes);
};

const resolveColumnValue = (
  row: TabularRow,
  headerLookup: Map<string, string>,
  columnHeader: string | undefined,
) => {
  if (!columnHeader) return "";
  const resolved = resolveHeader(headerLookup, columnHeader);
  if (!resolved) return "";
  return row.data[resolved] ?? "";
};

const normalizeTabular = (
  dataset: TabularDataset,
  spec: z.infer<typeof TabularMappingSpecSchema>,
  timeZone: string,
  format: InputFormat,
) => {
  validateTabularMapping(spec, dataset.headers);
  const headerLookup = buildHeaderLookup(dataset.headers);
  const errors: Array<z.infer<typeof ErrorSchema>> = [];

  const candidates: Array<{
    resourceLabel: string;
    start: Date;
    end: Date;
    reason?: string | null;
    sportRaw?: string | null;
    rowNumber: number;
  }> = [];

  const parsing = {
    timeZone,
    dateOrder: spec.parsing.dateOrder,
    timeFormat: spec.parsing.timeFormat,
    assumeLocal: spec.parsing.assumeTimeZoneWhenMissingOffset,
  };

  for (const row of dataset.rows) {
    const rowNumber = row.rowNumber;
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

    if (!resourceLabel.trim()) {
      errors.push({
        message: "Resource/court value is missing",
        format,
        row: rowNumber,
      });
      continue;
    }

    let reason: string | null | undefined;
    if (spec.reason.kind === "column") {
      reason =
        resolveColumnValue(row, headerLookup, spec.reason.column.header) ||
        null;
    }

    let sportRaw: string | null | undefined;
    if (spec.sport.kind === "column") {
      sportRaw =
        resolveColumnValue(row, headerLookup, spec.sport.column.header) || null;
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

    if (!start || !end) {
      errors.push({
        message: "Start or end time could not be parsed",
        format,
        row: rowNumber,
      });
      continue;
    }

    if (end.getTime() <= start.getTime()) {
      errors.push({
        message: "End time must be after start time",
        format,
        row: rowNumber,
      });
      continue;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (!Number.isFinite(durationMinutes) || durationMinutes % 60 !== 0) {
      errors.push({
        message: "Duration must be a multiple of 60 minutes",
        format,
        row: rowNumber,
      });
      continue;
    }

    if (!isHourAligned(start, timeZone) || !isHourAligned(end, timeZone)) {
      errors.push({
        message: "Start and end times must align to the hour (minute 0)",
        format,
        row: rowNumber,
      });
      continue;
    }

    candidates.push({
      resourceLabel: resourceLabel.trim(),
      start,
      end,
      reason: reason?.trim() || null,
      sportRaw: sportRaw?.trim() || null,
      rowNumber,
    });
  }

  return { candidates, errors };
};

const normalizeIcs = (
  occurrences: IcsOccurrence[],
  spec: z.infer<typeof IcsMappingSpecSchema>,
  timeZone: string,
) => {
  const errors: Array<z.infer<typeof ErrorSchema>> = [];
  const candidates: Array<{
    resourceLabel: string;
    start: Date;
    end: Date;
    reason?: string | null;
    sportRaw?: string | null;
    uid?: string;
  }> = [];

  for (const event of occurrences) {
    if (
      spec.parsing.ignoreCancelled &&
      event.status?.toLowerCase() === "cancelled"
    ) {
      continue;
    }
    if (spec.parsing.ignoreAllDay && event.isAllDay) {
      continue;
    }

    let resourceLabel = "";
    switch (spec.resource.kind) {
      case "location":
        resourceLabel = event.location ?? "";
        break;
      case "summary":
        resourceLabel = event.summary ?? "";
        break;
      case "description":
        resourceLabel = event.description ?? "";
        break;
      case "constant":
        resourceLabel = spec.resource.value;
        break;
      case "none":
        resourceLabel = "";
        break;
      default:
        resourceLabel = "";
    }

    if (!resourceLabel.trim()) {
      errors.push({
        message: "Resource/court value is missing",
        format: "ics",
        uid: event.uid,
      });
      continue;
    }

    let reason: string | null = null;
    if (spec.reason.kind === "summary") {
      reason = event.summary ?? null;
    }
    if (spec.reason.kind === "description") {
      reason = event.description ?? null;
    }

    if (event.end.getTime() <= event.start.getTime()) {
      errors.push({
        message: "End time must be after start time",
        format: "ics",
        uid: event.uid,
      });
      continue;
    }

    const durationMinutes =
      (event.end.getTime() - event.start.getTime()) / 60000;
    if (!Number.isFinite(durationMinutes) || durationMinutes % 60 !== 0) {
      errors.push({
        message: "Duration must be a multiple of 60 minutes",
        format: "ics",
        uid: event.uid,
      });
      continue;
    }

    if (
      !isHourAligned(event.start, timeZone) ||
      !isHourAligned(event.end, timeZone)
    ) {
      errors.push({
        message: "Start and end times must align to the hour (minute 0)",
        format: "ics",
        uid: event.uid,
      });
      continue;
    }

    candidates.push({
      resourceLabel: resourceLabel.trim(),
      start: event.start,
      end: event.end,
      reason: reason?.trim() || null,
      sportRaw: null,
      uid: event.uid,
    });
  }

  return { candidates, errors };
};

const normalizeImage = (
  extraction: z.infer<typeof ScreenshotExtractionSchema>,
  timeZone: string,
) => {
  const errors: Array<z.infer<typeof ErrorSchema>> = [];
  const candidates: Array<{
    resourceLabel: string;
    start: Date;
    end: Date;
    reason?: string | null;
    sportRaw?: string | null;
    rowNumber?: number;
  }> = [];

  const defaultLabel = extraction.calendarTitle?.trim() || "Calendar 1";

  extraction.events.forEach((event, index) => {
    const rowNumber = index + 1;
    const resourceLabel = event.resourceLabel?.trim() || defaultLabel;
    const timeSource = event.startTime || "";
    const time = parseImageTime(timeSource);

    if (!time) {
      errors.push({
        message: "Start time could not be parsed from screenshot",
        format: "image",
        row: rowNumber,
      });
      return;
    }

    const start = new TZDate(
      extraction.year,
      extraction.month - 1,
      event.day,
      time.hour,
      time.minute,
      timeZone,
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    if (!isHourAligned(start, timeZone) || !isHourAligned(end, timeZone)) {
      errors.push({
        message: "Start and end times must align to the hour (minute 0)",
        format: "image",
        row: rowNumber,
      });
      return;
    }

    candidates.push({
      resourceLabel,
      start,
      end,
      reason: event.title?.trim() || null,
      sportRaw: null,
      rowNumber,
    });
  });

  return { candidates, errors };
};

const buildOutput = (
  format: InputFormat,
  timeZone: string,
  candidates: Array<{
    resourceLabel: string;
    start: Date;
    end: Date;
    reason?: string | null;
    sportRaw?: string | null;
    rowNumber?: number;
    uid?: string;
  }>,
  errors: Array<z.infer<typeof ErrorSchema>>,
) => {
  const uniqueLabels = Array.from(
    new Set(
      candidates.map((item) => item.resourceLabel.trim()).filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const resourceIdByLabel = new Map<string, string>();
  uniqueLabels.forEach((label, index) => {
    resourceIdByLabel.set(label, `r${index + 1}`);
  });

  const resources: Array<z.infer<typeof ResourceSchema>> = [];
  const sportsDetectedSet = new Set<SportSlug>();

  for (const label of uniqueLabels) {
    const matching = candidates.filter((item) => item.resourceLabel === label);
    let sport: SportSlug = "unknown";

    for (const candidate of matching) {
      if (candidate.sportRaw) {
        const resolved = resolveSportValue(candidate.sportRaw);
        if (resolved !== "unknown") {
          sport = resolved;
          break;
        }
      }
    }

    if (sport === "unknown") {
      sport = inferSportFromText(label);
      if (sport === "unknown") {
        for (const candidate of matching) {
          if (candidate.reason) {
            const inferred = inferSportFromText(candidate.reason);
            if (inferred !== "unknown") {
              sport = inferred;
              break;
            }
          }
        }
      }
    }

    resources.push({
      resourceId: resourceIdByLabel.get(label) ?? label,
      label,
      sport,
    });
    sportsDetectedSet.add(sport);
  }

  const blocks: Array<z.infer<typeof BlockSchema>> = candidates.map(
    (item, index) => ({
      resourceId:
        resourceIdByLabel.get(item.resourceLabel) ?? item.resourceLabel,
      startTime: toUtcISOString(item.start),
      endTime: toUtcISOString(item.end),
      reason: item.reason ?? null,
      source:
        format === "ics"
          ? { format: "ics", uid: item.uid }
          : { format, row: item.rowNumber ?? index + 1 },
    }),
  );

  const output = {
    meta: {
      format,
      timeZoneFallback: timeZone,
      isMultiCourt: uniqueLabels.length > 1,
      resources,
      sportsDetected: Array.from(sportsDetectedSet),
    },
    blocks,
    errors,
  };

  return OutputSchema.parse(output);
};

const main = async () => {
  const options = parseArgs();
  const resolvedPath = path.resolve(process.cwd(), options.filePath);
  const format = options.format;
  warnOnFormatMismatch(resolvedPath, format);

  if (format === "image") {
    if (options.mappingFile) {
      throw new Error("--mapping-file is not supported for --format=image");
    }
    if (options.noAi && !options.extractedFile) {
      throw new Error("--extracted-file is required when using --no-ai");
    }

    let extraction: z.infer<typeof ScreenshotExtractionSchema> | null = null;
    if (options.extractedFile) {
      const extractedContent = await readFile(options.extractedFile, "utf-8");
      extraction = ScreenshotExtractionSchema.parse(
        JSON.parse(extractedContent),
      );
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for image normalization");
      }

      const imageBuffer = await readFile(resolvedPath);
      const { object } = await generateObject({
        model: openai(options.model),
        schema: ScreenshotExtractionSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Extract booking entries from this calendar screenshot.",
                  "Return month (number), year, and a list of events.",
                  "Each event needs day (number), startTime (HH:mm, 24h), and optional title.",
                  "If the screenshot does not show a court/resource label, omit resourceLabel.",
                  "Use only the visible events in the screenshot.",
                  "If you cannot read a time clearly, omit that event.",
                ].join(" "),
              },
              {
                type: "image",
                image: imageBuffer,
                providerOptions: { openai: { imageDetail: "low" } },
              },
            ],
          },
        ],
      });

      extraction = object;
    }

    if (!extraction) {
      throw new Error("Failed to extract image bookings");
    }

    if (options.saveExtractedFile) {
      await saveMappingSpec(options.saveExtractedFile, extraction);
    }

    const { candidates, errors } = normalizeImage(extraction, options.timeZone);
    const output = buildOutput(format, options.timeZone, candidates, errors);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  let mappingSpec: z.infer<typeof NormalizationMappingSpecSchema> | null = null;
  if (options.mappingFile) {
    mappingSpec = await loadMappingSpec(options.mappingFile);
  } else if (options.noAi) {
    throw new Error("--mapping-file is required when using --no-ai");
  }

  if (!mappingSpec && format !== "ics" && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for AI normalization");
  }

  if (!mappingSpec) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for AI normalization");
    }
  }

  if (!mappingSpec) {
    if (format === "ics") {
      const content = await readFile(resolvedPath, "utf-8");
      const sampleEvents = parseIcs(
        content,
        options.rangeStart,
        options.rangeEnd,
      )
        .slice(0, 20)
        .map((event) => ({
          summary: event.summary,
          location: event.location,
          description: event.description,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          status: event.status,
        }));

      const { object } = await generateObject({
        model: openai(options.model),
        schema: IcsMappingHintResponseSchema,
        system: "You are a data extraction engine. Return JSON only.",
        prompt: buildPrompt({
          format,
          timeZoneFallback: options.timeZone,
          sampleEvents,
        }),
      });

      const hint = object.mapping;
      mappingSpec = IcsMappingSpecSchema.parse({
        format: "ics",
        version: 1,
        resource:
          hint.resourceKind === "constant"
            ? { kind: "constant", value: hint.resourceValue || "Court 1" }
            : { kind: hint.resourceKind },
        reason: { kind: hint.reasonKind },
        sport: { kind: hint.sportKind },
        parsing: {
          timeZoneFallback: options.timeZone,
          ignoreCancelled: hint.ignoreCancelled,
          ignoreAllDay: hint.ignoreAllDay,
        },
      });
    } else {
      const fileBuffer = await readFile(resolvedPath);
      const dataset =
        format === "csv"
          ? buildTabularDataset(parseCsv(fileBuffer.toString("utf-8")))
          : parseXlsx(fileBuffer);

      const sampleRows = dataset.rows.slice(0, 20).map((row) => row.data);
      const { object } = await generateObject({
        model: openai(options.model),
        schema: TabularMappingHintResponseSchema,
        system: "You are a data extraction engine. Return JSON only.",
        prompt: buildPrompt({
          format,
          timeZoneFallback: options.timeZone,
          headers: dataset.headers,
          sampleRows,
        }),
      });

      const hint = object.mapping;
      const resource = hint.resourceColumn
        ? { kind: "column", column: { header: hint.resourceColumn } }
        : { kind: "constant", value: "Court 1" };
      const reason = hint.reasonColumn
        ? { kind: "column", column: { header: hint.reasonColumn } }
        : { kind: "none" };
      const sport = hint.sportColumn
        ? { kind: "column", column: { header: hint.sportColumn } }
        : { kind: "infer" };

      mappingSpec = TabularMappingSpecSchema.parse({
        format,
        version: 1,
        dateTimeMode: hint.dateTimeMode,
        resource,
        reason,
        sport,
        start: {
          datetime: hint.startDateTimeColumn
            ? { header: hint.startDateTimeColumn }
            : undefined,
          date: hint.startDateColumn
            ? { header: hint.startDateColumn }
            : undefined,
          time: hint.startTimeColumn
            ? { header: hint.startTimeColumn }
            : undefined,
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
          timeZoneFallback: options.timeZone,
          dateOrder: "ymd",
          timeFormat: "24h",
          assumeTimeZoneWhenMissingOffset: true,
        },
      });
    }
  }

  if (!mappingSpec) {
    throw new Error("Failed to build mapping spec");
  }

  if (mappingSpec.format !== format) {
    throw new Error(
      `Mapping spec format (${mappingSpec.format}) does not match input format (${format})`,
    );
  }

  if ("parsing" in mappingSpec) {
    mappingSpec.parsing.timeZoneFallback = options.timeZone;
  }

  if (options.saveMappingFile) {
    await saveMappingSpec(options.saveMappingFile, mappingSpec);
  }

  if (format === "ics") {
    const content = await readFile(resolvedPath, "utf-8");
    const occurrences = parseIcs(content, options.rangeStart, options.rangeEnd);
    const { candidates, errors } = normalizeIcs(
      occurrences,
      mappingSpec as z.infer<typeof IcsMappingSpecSchema>,
      options.timeZone,
    );
    const output = buildOutput(format, options.timeZone, candidates, errors);
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  const fileBuffer = await readFile(resolvedPath);
  const dataset =
    format === "csv"
      ? buildTabularDataset(parseCsv(fileBuffer.toString("utf-8")))
      : parseXlsx(
          fileBuffer,
          (mappingSpec as z.infer<typeof TabularMappingSpecSchema>).sheetName,
        );

  const { candidates, errors } = normalizeTabular(
    dataset,
    mappingSpec as z.infer<typeof TabularMappingSpecSchema>,
    options.timeZone,
    format,
  );
  const output = buildOutput(format, options.timeZone, candidates, errors);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
