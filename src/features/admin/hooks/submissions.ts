"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
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
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminSubmissionApprove, {
    onSuccess: async () => {
      await utils.admin.courtSubmission.list.invalidate();
    },
  });
}

export function useMutAdminRejectSubmission() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminSubmissionReject, {
    onSuccess: async () => {
      await utils.admin.courtSubmission.list.invalidate();
    },
  });
}

export function useMutAdminBanSubmitter() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminSubmissionBanUser, {
    onSuccess: async () => {
      await utils.admin.courtSubmission.list.invalidate();
    },
  });
}

export function useMutAdminUnbanSubmitter() {
  return useFeatureMutation(adminApi.mutAdminSubmissionUnbanUser);
}
