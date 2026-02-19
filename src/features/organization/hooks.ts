"use client";

import { useFeatureMutation } from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOrganizationApi } from "./api.runtime";

const organizationApi = getOrganizationApi();

export function useMutOrganizationCreate(
  onSuccess?: (data: { id: string }) => void,
) {
  const utils = trpc.useUtils();

  return useFeatureMutation(organizationApi.mutOrganizationCreate, {
    onSuccess: async (data) => {
      utils.organization.my.setData(undefined, (prev) =>
        prev ? [...prev, data.organization] : [data.organization],
      );
      await utils.organization.invalidate();
      onSuccess?.({ id: data.organization.id });
    },
  });
}
