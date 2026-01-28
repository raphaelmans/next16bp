import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { IcsOccurrence } from "./ics-parser";

const IcsMappingHintSchema = z.object({
  resourceKind: z.enum([
    "location",
    "summary",
    "description",
    "constant",
    "none",
  ]),
  resourceValue: z.string().optional().nullable(),
  reasonKind: z.enum(["summary", "description", "none"]),
  ignoreCancelled: z.boolean().default(true),
  ignoreAllDay: z.boolean().default(true),
});

const IcsMappingHintResponseSchema = z.object({
  mapping: IcsMappingHintSchema,
});

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
  parsing: z.object({
    ignoreCancelled: z.boolean().default(true),
    ignoreAllDay: z.boolean().default(true),
  }),
});

export type IcsMappingSpec = z.infer<typeof IcsMappingSpecSchema>;

export type IcsParsedRow = {
  rowNumber: number;
  courtLabel: string | null;
  startTime: Date;
  endTime: Date;
  reason: string | null;
  sourceData: Record<string, unknown>;
};

const DEFAULT_ICS_MODEL = "gpt-5.2";

const buildIcsMappingPrompt = (input: {
  sampleEvents: Array<Record<string, string | null | undefined>>;
}) =>
  [
    "Return ONLY JSON. No markdown, no comments.",
    "The JSON must be an object with a top-level key named 'mapping'.",
    "Goal: choose which ICS fields represent the court/resource label and reason.",
    "resourceKind options: location|summary|description|constant|none",
    "reasonKind options: summary|description|none",
    "If resourceKind is constant, provide resourceValue.",
    "ignoreCancelled should usually be true.",
    "ignoreAllDay should usually be true.",
    "",
    "INPUT:",
    JSON.stringify(input, null, 2),
  ].join("\n");

export async function generateIcsMappingSpec(params: {
  sampleEvents: Array<Record<string, string | null | undefined>>;
  model?: string;
}): Promise<IcsMappingSpec> {
  const { sampleEvents, model = DEFAULT_ICS_MODEL } = params;

  const { object } = await generateObject({
    model: openai(model),
    schema: IcsMappingHintResponseSchema,
    system: "You are a data extraction engine. Return JSON only.",
    prompt: buildIcsMappingPrompt({ sampleEvents }),
  });

  const hint = object.mapping;
  const resourceValue = hint.resourceValue?.trim();
  const resource =
    hint.resourceKind === "constant"
      ? { kind: "constant", value: resourceValue || "Court 1" }
      : { kind: hint.resourceKind };

  return IcsMappingSpecSchema.parse({
    format: "ics",
    version: 1,
    resource,
    reason: { kind: hint.reasonKind },
    parsing: {
      ignoreCancelled: hint.ignoreCancelled,
      ignoreAllDay: hint.ignoreAllDay,
    },
  });
}

export function buildIcsRowsFromSpec(params: {
  occurrences: IcsOccurrence[];
  spec: IcsMappingSpec;
}): IcsParsedRow[] {
  const { occurrences, spec } = params;
  const rows: IcsParsedRow[] = [];

  occurrences.forEach((event, index) => {
    if (
      spec.parsing.ignoreCancelled &&
      event.status?.toLowerCase() === "cancelled"
    ) {
      return;
    }
    if (spec.parsing.ignoreAllDay && event.isAllDay) {
      return;
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
      default:
        resourceLabel = "";
    }

    let reason: string | null = null;
    if (spec.reason.kind === "summary") {
      reason = event.summary ?? null;
    }
    if (spec.reason.kind === "description") {
      reason = event.description ?? null;
    }

    rows.push({
      rowNumber: index + 1,
      courtLabel: resourceLabel.trim() || null,
      startTime: event.start,
      endTime: event.end,
      reason: reason?.trim() || null,
      sourceData: {
        summary: event.summary ?? null,
        location: event.location ?? null,
        description: event.description ?? null,
        uid: event.uid ?? null,
        status: event.status ?? null,
      },
    });
  });

  return rows;
}
