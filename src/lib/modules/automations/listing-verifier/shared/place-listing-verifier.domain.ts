import type {
  PlaceListingBaselineFlag,
  PlaceListingDecision,
  PlaceListingEvidence,
  PlaceListingLabel,
  PlaceListingReasonCode,
  PlaceListingTrackingBucket,
  PlaceListingVerifierReport,
} from "./place-listing-verifier.schemas";

const NON_PRODUCTION_SLUG_REGEX =
  /(^|[-_])(test|example|dummy|sample|staging|sandbox|tmp|qa|dev)([-_]|$)/i;

const GENERIC_SLUGS = new Set([
  "venue",
  "venues",
  "my-venue",
  "organization",
  "my-organization",
  "court",
  "courts",
  "my-court",
  "pickleball-court",
  "pickleball-courts",
  "badminton-court",
  "badminton-courts",
  "basketball-court",
  "basketball-courts",
  "tennis-court",
  "tennis-courts",
]);

const GENERIC_NAME_PATTERNS = [
  /^(my|your)\s+(venue|organization|court|courts)$/i,
  /^(venue|organization|court|courts)$/i,
  /^(pickleball|badminton|basketball|tennis)\s+court(s)?$/i,
];

type RawEvidence = Omit<
  PlaceListingEvidence,
  "baselineFlags" | "baselineSuggestion"
>;

export function toTrackingBucket(
  placeType: PlaceListingEvidence["placeType"],
): PlaceListingTrackingBucket {
  return placeType === "CURATED" ? "curated_place" : "org_created_place";
}

export function buildBaselineFlags(
  evidence: RawEvidence,
): PlaceListingBaselineFlag[] {
  const flags = new Set<PlaceListingBaselineFlag>();
  const normalizedSlug = evidence.slug.trim().toLowerCase();
  const normalizedName = evidence.name.trim();

  if (NON_PRODUCTION_SLUG_REGEX.test(normalizedSlug)) {
    flags.add("nonprod_slug");
  }

  if (
    GENERIC_SLUGS.has(normalizedSlug) ||
    /^(my|your)-(venue|organization|court|courts)$/.test(normalizedSlug)
  ) {
    flags.add("generic_slug");
  }

  if (GENERIC_NAME_PATTERNS.some((pattern) => pattern.test(normalizedName))) {
    flags.add("generic_name");
  }

  if (
    evidence.address.trim().length === 0 ||
    evidence.city.trim().length === 0 ||
    evidence.province.trim().length === 0
  ) {
    flags.add("missing_location");
  }

  if (evidence.activeCourtCount <= 0) {
    flags.add("no_active_courts");
  }

  if (
    evidence.photoCount <= 0 &&
    !evidence.hasContactDetails &&
    evidence.verificationStatus !== "VERIFIED"
  ) {
    flags.add("missing_trust_signal");
  }

  return Array.from(flags).sort();
}

export function deriveDeterministicSuggestion(
  flags: PlaceListingBaselineFlag[],
): {
  label: PlaceListingLabel;
  reasonCode: PlaceListingReasonCode;
} {
  if (flags.includes("nonprod_slug")) {
    return {
      label: "remove",
      reasonCode: "nonprod_or_test",
    };
  }

  if (flags.includes("generic_slug") || flags.includes("generic_name")) {
    return {
      label: "remove",
      reasonCode: "generic_or_placeholder",
    };
  }

  if (flags.includes("missing_location")) {
    return {
      label: "review",
      reasonCode: "missing_location",
    };
  }

  if (flags.includes("missing_trust_signal")) {
    return {
      label: "review",
      reasonCode: "missing_trust_signal",
    };
  }

  if (flags.includes("no_active_courts")) {
    return {
      label: "review",
      reasonCode: "needs_manual_review",
    };
  }

  return {
    label: "keep",
    reasonCode: "looks_valid",
  };
}

export function toListingEvidence(raw: RawEvidence): PlaceListingEvidence {
  const baselineFlags = buildBaselineFlags(raw);
  return {
    ...raw,
    baselineFlags,
    baselineSuggestion: deriveDeterministicSuggestion(baselineFlags),
  };
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error("Chunk size must be greater than zero");
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function normalizeDecisionsForBatch(
  batch: PlaceListingEvidence[],
  decisions: PlaceListingDecision[],
): PlaceListingDecision[] {
  const byId = new Map(
    decisions.map((decision) => [decision.placeId, decision]),
  );

  return batch.map((item) => {
    const existing = byId.get(item.placeId);
    if (existing) {
      return existing;
    }

    return {
      placeId: item.placeId,
      trackingBucket: item.trackingBucket,
      label: item.baselineSuggestion.label,
      confidence: "low",
      reasonCode: item.baselineSuggestion.reasonCode,
      reasonSummary:
        "Missing model decision. Fell back to deterministic baseline suggestion.",
    };
  });
}

function createCountRecord<T extends string>(
  keys: readonly T[],
): Record<T, number> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export function summarizeReport(input: {
  envLabel: string;
  model: string;
  batchSize: number;
  results: Array<{
    evidence: PlaceListingEvidence;
    decision: PlaceListingDecision;
  }>;
}): PlaceListingVerifierReport {
  const labelCounts = createCountRecord(["keep", "review", "remove"] as const);
  const reasonCounts = createCountRecord([
    "looks_valid",
    "nonprod_or_test",
    "missing_trust_signal",
    "generic_or_placeholder",
    "missing_location",
    "possible_duplicate",
    "needs_manual_review",
  ] as const);

  const bucketRows = new Map<
    PlaceListingTrackingBucket,
    {
      trackingBucket: PlaceListingTrackingBucket;
      activePlaces: number;
      keepCount: number;
      reviewCount: number;
      removeCount: number;
      baselineFlagCounts: Record<PlaceListingBaselineFlag, number>;
    }
  >();

  for (const result of input.results) {
    labelCounts[result.decision.label] += 1;
    reasonCounts[result.decision.reasonCode] += 1;

    const bucket = bucketRows.get(result.evidence.trackingBucket) ?? {
      trackingBucket: result.evidence.trackingBucket,
      activePlaces: 0,
      keepCount: 0,
      reviewCount: 0,
      removeCount: 0,
      baselineFlagCounts: createCountRecord([
        "nonprod_slug",
        "generic_slug",
        "generic_name",
        "missing_location",
        "missing_trust_signal",
        "no_active_courts",
      ] as const),
    };

    bucket.activePlaces += 1;
    if (result.decision.label === "keep") bucket.keepCount += 1;
    if (result.decision.label === "review") bucket.reviewCount += 1;
    if (result.decision.label === "remove") bucket.removeCount += 1;

    for (const flag of result.evidence.baselineFlags) {
      bucket.baselineFlagCounts[flag] += 1;
    }

    bucketRows.set(result.evidence.trackingBucket, bucket);
  }

  return {
    generatedAt: new Date().toISOString(),
    envLabel: input.envLabel,
    model: input.model,
    batchSize: input.batchSize,
    totalPlaces: input.results.length,
    summaries: Array.from(bucketRows.values()).sort((a, b) =>
      a.trackingBucket.localeCompare(b.trackingBucket),
    ),
    labelCounts,
    reasonCounts,
    results: input.results,
  };
}

export function renderMarkdownReport(
  report: PlaceListingVerifierReport,
): string {
  const summaryLines = report.summaries.map(
    (row) =>
      `| \`${row.trackingBucket}\` | ${row.activePlaces} | ${row.keepCount} | ${row.reviewCount} | ${row.removeCount} |`,
  );

  const flaggedRows = report.results
    .filter((row) => row.decision.label !== "keep")
    .slice(0, 50)
    .map(
      (row) =>
        `| \`${row.evidence.trackingBucket}\` | \`${row.decision.label}\` | \`${row.decision.reasonCode}\` | \`${row.evidence.slug}\` | ${row.evidence.name} | ${row.evidence.city} | ${row.evidence.province} |`,
    );

  return [
    "# Place Listing Verifier Report",
    "",
    `Generated at: \`${report.generatedAt}\``,
    `Environment: \`${report.envLabel}\``,
    `Model: \`${report.model}\``,
    `Batch size: \`${report.batchSize}\``,
    `Total places: \`${report.totalPlaces}\``,
    "",
    "## Summary",
    "",
    "| Tracking bucket | Active places | Keep | Review | Remove |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...summaryLines,
    "",
    "## Flagged Places",
    "",
    "| Tracking bucket | Label | Reason code | Slug | Name | City | Province |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...(flaggedRows.length > 0
      ? flaggedRows
      : ["| - | - | - | - | - | - | - |"]),
    "",
  ].join("\n");
}
