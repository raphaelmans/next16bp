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
      const payload = data as { organization: { id: string } };
      utils.organization.my.setData(undefined, [payload.organization] as any);
      await utils.organization.invalidate();
      onSuccess?.({ id: payload.organization.id });
    },
  });
}
