"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export function useQueryAdminSubmissions(options?: {
  status?: SubmissionStatus;
  limit?: number;
  offset?: number;
}) {
  return useFeatureQuery(
    ["admin", "courtSubmission", "list"],
    adminApi.queryAdminSubmissionList,
    options,
  );
}

export function useMutAdminApproveSubmission() {
  const queryClient = useQueryClient();

  return useFeatureMutation(adminApi.mutAdminSubmissionApprove, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["admin", "courtSubmission", "list"]),
      });
    },
  });
}

export function useMutAdminRejectSubmission() {
  const queryClient = useQueryClient();

  return useFeatureMutation(adminApi.mutAdminSubmissionReject, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["admin", "courtSubmission", "list"]),
      });
    },
  });
}

export function useMutAdminBanSubmitter() {
  const queryClient = useQueryClient();

  return useFeatureMutation(adminApi.mutAdminSubmissionBanUser, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["admin", "courtSubmission", "list"]),
      });
    },
  });
}

export function useMutAdminUnbanSubmitter() {
  return useFeatureMutation(adminApi.mutAdminSubmissionUnbanUser);
}
