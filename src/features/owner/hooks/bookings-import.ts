"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useMutOwnerImportCreateDraft(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(ownerApi.mutBookingsImportCreateDraft, options);
}

export function useQueryOwnerImportAiUsage(
  input?: Parameters<typeof ownerApi.queryBookingsImportAiUsage>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["bookingsImport", "aiUsage"],
    ownerApi.queryBookingsImportAiUsage,
    input,
    options,
  );
}

export function useQueryOwnerImportJob(
  input?: Parameters<typeof ownerApi.queryBookingsImportGetJob>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["bookingsImport", "getJob"],
    ownerApi.queryBookingsImportGetJob,
    input,
    options,
  );
}

export function useQueryOwnerImportRows(
  input?: Parameters<typeof ownerApi.queryBookingsImportListRows>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["bookingsImport", "listRows"],
    ownerApi.queryBookingsImportListRows,
    input,
    options,
  );
}

export function useQueryOwnerImportSources(
  input?: Parameters<typeof ownerApi.queryBookingsImportListSources>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["bookingsImport", "listSources"],
    ownerApi.queryBookingsImportListSources,
    input,
    options,
  );
}

export function useMutOwnerImportNormalize(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutBookingsImportNormalize, options);
}

export function useMutOwnerImportUpdateRow(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutBookingsImportUpdateRow, options);
}

export function useMutOwnerImportDeleteRow(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutBookingsImportDeleteRow, options);
}

export function useMutOwnerImportDiscardJob(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutBookingsImportDiscardJob, options);
}

export function useMutOwnerImportCommit(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutBookingsImportCommit, options);
}

export function useMutOwnerImportReplaceWithGuest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    ownerApi.mutBookingsImportReplaceWithGuest,
    options,
  );
}
