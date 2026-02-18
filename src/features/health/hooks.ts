"use client";

import { useFeatureQuery } from "@/common/feature-api-hooks";
import { getHealthApi } from "./api.runtime";

const healthApi = getHealthApi();

export function useQueryHealthCheck() {
  return useFeatureQuery(["health", "check"], healthApi.queryHealthCheck);
}
