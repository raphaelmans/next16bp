"use client";

import { useFeatureQuery } from "@/common/feature-api-hooks";
import { getOwnerApi } from "@/features/owner/api";
import type {
  OperationsOutput,
  RevenueOutput,
  UtilizationOutput,
} from "@/lib/modules/analytics/dtos/analytics.dto";

const ANALYTICS_STALE_TIME = 5 * 60 * 1000;

const ownerApi = getOwnerApi();

export function useQueryAnalyticsRevenue(
  organizationId: string | null,
  from: string,
  to: string,
  enabled: boolean,
) {
  return useFeatureQuery<
    readonly string[],
    { organizationId: string; from: string; to: string },
    RevenueOutput
  >(
    ["analytics", "getRevenue"],
    ownerApi.queryAnalyticsGetRevenue,
    { organizationId: organizationId ?? "", from, to },
    {
      enabled: !!organizationId && enabled,
      staleTime: ANALYTICS_STALE_TIME,
    },
  );
}

export function useQueryAnalyticsUtilization(
  organizationId: string | null,
  from: string,
  to: string,
  enabled: boolean,
) {
  return useFeatureQuery<
    readonly string[],
    { organizationId: string; from: string; to: string },
    UtilizationOutput
  >(
    ["analytics", "getUtilization"],
    ownerApi.queryAnalyticsGetUtilization,
    { organizationId: organizationId ?? "", from, to },
    {
      enabled: !!organizationId && enabled,
      staleTime: ANALYTICS_STALE_TIME,
    },
  );
}

export function useQueryAnalyticsOperations(
  organizationId: string | null,
  from: string,
  to: string,
  enabled: boolean,
) {
  return useFeatureQuery<
    readonly string[],
    { organizationId: string; from: string; to: string },
    OperationsOutput
  >(
    ["analytics", "getOperations"],
    ownerApi.queryAnalyticsGetOperations,
    { organizationId: organizationId ?? "", from, to },
    {
      enabled: !!organizationId && enabled,
      staleTime: ANALYTICS_STALE_TIME,
    },
  );
}
