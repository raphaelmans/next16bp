"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { getCourtSubmissionApi } from "./api.runtime";

const courtSubmissionApi = getCourtSubmissionApi();

export function useMutSubmitCourt() {
  return useFeatureMutation(courtSubmissionApi.mutSubmitCourt);
}

export function useQueryMySubmissions(
  input?: { limit?: number; offset?: number },
  options?: { enabled?: boolean },
) {
  return useFeatureQuery(
    ["courtSubmission", "getMySubmissions"],
    courtSubmissionApi.queryMySubmissions,
    input,
    options,
  );
}

export function useQueryParseGoogleMapsLink(
  input?: { url: string },
  options?: { enabled?: boolean },
) {
  return useFeatureQuery(
    ["courtSubmission", "parseGoogleMapsLink"],
    courtSubmissionApi.queryParseGoogleMapsLink,
    input,
    options,
  );
}
