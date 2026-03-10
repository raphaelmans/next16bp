"use client";

import type {
  DeveloperApiKeySummary,
  DeveloperCourtMapping,
  DeveloperPrecheckCheck,
  DeveloperPrecheckResult,
  DeveloperStatus,
} from "./schemas";

export function getDeveloperStatusTone(status: DeveloperStatus) {
  switch (status) {
    case "PASS":
      return "text-success bg-success/10 border-success/20";
    case "WARN":
      return "text-warning bg-warning/10 border-warning/20";
    case "FAIL":
      return "text-destructive bg-destructive/10 border-destructive/20";
  }
}

export function formatDeveloperLastUsedLabel(value?: string | null) {
  if (!value) return "Never used";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Unknown";
  }
}

export function buildDeveloperLaunchpad(items: {
  integrationsCount: number;
  keysCount: number;
  mappingsCount: number;
  precheck?: DeveloperPrecheckResult | null;
}) {
  return [
    {
      id: "integration",
      label: "Create integration",
      done: items.integrationsCount > 0,
    },
    {
      id: "keys",
      label: "Issue API key",
      done: items.keysCount > 0,
    },
    {
      id: "mappings",
      label: "Map at least one court",
      done: items.mappingsCount > 0,
    },
    {
      id: "precheck",
      label: "Run precheck",
      done: items.precheck?.status === "PASS",
    },
  ];
}

export function getPrimaryMappedCourtId(
  mappings: DeveloperCourtMapping[] | undefined,
) {
  return mappings?.[0]?.externalCourtId ?? null;
}

export function getValidMappedCourtId(
  currentExternalCourtId: string | null | undefined,
  mappings: DeveloperCourtMapping[] | undefined,
) {
  if (!mappings || mappings.length === 0) {
    return null;
  }

  if (
    currentExternalCourtId &&
    mappings.some(
      (mapping) => mapping.externalCourtId === currentExternalCourtId,
    )
  ) {
    return currentExternalCourtId;
  }

  return mappings[0]?.externalCourtId ?? null;
}

export function getRecommendedKeyId(
  keys: DeveloperApiKeySummary[] | undefined,
) {
  return (
    keys?.find((key) => key.status === "ACTIVE" && !key.revokedAt)?.id ??
    keys?.[0]?.id ??
    null
  );
}

export function getValidDeveloperKeyId(
  currentKeyId: string | null | undefined,
  keys: DeveloperApiKeySummary[] | undefined,
) {
  if (!keys || keys.length === 0) {
    return null;
  }

  if (
    currentKeyId &&
    keys.some(
      (key) =>
        key.id === currentKeyId && key.status === "ACTIVE" && !key.revokedAt,
    )
  ) {
    return currentKeyId;
  }

  return getRecommendedKeyId(keys);
}

export function getSnippetApiKeyValue(args: {
  selectedKeyId: string | null | undefined;
  latestRevealedSecret:
    | {
        keyId: string;
        secret: string;
      }
    | null
    | undefined;
}) {
  if (
    args.selectedKeyId &&
    args.latestRevealedSecret &&
    args.latestRevealedSecret.keyId === args.selectedKeyId
  ) {
    return args.latestRevealedSecret.secret;
  }

  return null;
}

export function buildDeveloperCurlSnippet(args: {
  origin: string;
  externalCourtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  apiKey?: string | null;
}) {
  const url = new URL(
    `/api/developer/v1/courts/${args.externalCourtId}/availability`,
    args.origin || "https://app.example.com",
  );
  url.searchParams.set("date", args.date);
  url.searchParams.set("durationMinutes", String(args.durationMinutes));
  if (args.includeUnavailable) {
    url.searchParams.set("includeUnavailable", "true");
  }

  return [
    `curl -sS "${url.toString()}" \\`,
    `  -H "X-API-Key: ${args.apiKey ?? "YOUR_API_KEY"}" \\`,
    `  -H "Accept: application/json"`,
  ].join("\n");
}

export function buildDeveloperJsSnippet(args: {
  origin: string;
  externalCourtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  apiKey?: string | null;
}) {
  const base = args.origin || "https://app.example.com";
  return [
    "const url = new URL(",
    `  "${base}/api/developer/v1/courts/${args.externalCourtId}/availability",`,
    ");",
    `url.searchParams.set("date", "${args.date}");`,
    `url.searchParams.set("durationMinutes", "${args.durationMinutes}");`,
    ...(args.includeUnavailable
      ? ['url.searchParams.set("includeUnavailable", "true");']
      : []),
    "",
    "const response = await fetch(url, {",
    `  headers: { "X-API-Key": "${args.apiKey ?? "YOUR_API_KEY"}" },`,
    "});",
    "const json = await response.json();",
    "console.log(json);",
  ].join("\n");
}

export function getDeveloperCheckSummary(
  checks: DeveloperPrecheckCheck[] | undefined,
) {
  return {
    passed: checks?.filter((check) => check.status === "PASS").length ?? 0,
    warned: checks?.filter((check) => check.status === "WARN").length ?? 0,
    failed: checks?.filter((check) => check.status === "FAIL").length ?? 0,
  };
}
