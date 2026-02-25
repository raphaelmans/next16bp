"use client";

import * as React from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getCourtAddonsApi } from "./api.runtime";
import { type CourtAddonConfig, mergeAddonConfigs } from "./helpers";

const courtAddonsApi = getCourtAddonsApi();

export function useQueryCourtAddons(
  courtId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["courtAddon", "get"],
    courtAddonsApi.queryCourtAddonGet,
    { courtId },
    { enabled: !!courtId && isEnabled },
  ) as ReturnType<typeof useFeatureQuery> & {
    data: CourtAddonConfig[] | undefined;
  };
}

export function useQueryPlaceAddons(
  placeId: string,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;
  return useFeatureQuery(
    ["placeAddon", "get"],
    courtAddonsApi.queryPlaceAddonGet,
    { placeId },
    { enabled: !!placeId && isEnabled },
  ) as ReturnType<typeof useFeatureQuery> & {
    data: CourtAddonConfig[] | undefined;
  };
}

export function useCombinedAddons(
  placeId: string | undefined,
  courtId: string | undefined,
) {
  const placeQuery = useQueryPlaceAddons(placeId ?? "", {
    enabled: !!placeId,
  });
  const courtQuery = useQueryCourtAddons(courtId ?? "", {
    enabled: !!courtId,
  });

  const combined = React.useMemo(() => {
    const globalAddons = (placeQuery.data ?? []).filter(
      (c) => c.addon.isActive,
    );
    const courtAddons = (courtQuery.data ?? []) as CourtAddonConfig[];

    return mergeAddonConfigs({
      globalAddons,
      courtAddons,
    });
  }, [placeQuery.data, courtQuery.data]);

  return {
    ...combined,
    isLoading: placeQuery.isLoading || courtQuery.isLoading,
  };
}

export function useMutSetCourtAddons(courtId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(courtAddonsApi.mutCourtAddonSet, {
    onSuccess: async () => {
      await utils.courtAddon.get.invalidate({ courtId });
    },
  });
}
