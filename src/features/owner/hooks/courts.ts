"use client";

import { useMutation } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useMemo } from "react";
import {
  createFeatureQueryOptions,
  useFeatureMutation,
  useFeatureQueries,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";
import type { CourtFormData } from "../schemas";

const ownerApi = getOwnerApi();

interface CreateCourtResult {
  success: boolean;
  courtId: string;
}

interface UseCourtFormOptions {
  courtId?: string;
  onSuccess?: (result: CreateCourtResult) => void;
}

const normalizeTierLabel = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function useModCourtForm({ courtId, onSuccess }: UseCourtFormOptions) {
  const utils = trpc.useUtils();
  const isEditing = !!courtId;

  const createMutation = useFeatureMutation(ownerApi.mutCourtManagementCreate, {
    onSuccess: async (result) => {
      await utils.courtManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const updateMutation = useFeatureMutation(ownerApi.mutCourtManagementUpdate, {
    onSuccess: async (result) => {
      await utils.courtManagement.invalidate();
      if (courtId) {
        await utils.courtManagement.getById.invalidate({ courtId });
      }
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const submitAsync = async (data: CourtFormData) => {
    if (isEditing && courtId) {
      await updateMutation.mutateAsync({
        courtId,
        sportId: data.sportId,
        label: data.label,
        tierLabel: normalizeTierLabel(data.tierLabel),
        isActive: data.isActive,
      });
      return;
    }

    await createMutation.mutateAsync({
      placeId: data.placeId,
      sportId: data.sportId,
      label: data.label,
      tierLabel: normalizeTierLabel(data.tierLabel),
    });
  };

  const submit = (data: CourtFormData) => {
    void submitAsync(data).catch(() => undefined);
  };

  return {
    submit,
    submitAsync,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
    isEditing,
  };
}

export function useMutCourtDraft() {
  return useMutation({
    mutationFn: async (_data: Partial<CourtFormData>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId: "draft-court-id" };
    },
  });
}

const DEFAULT_COURT_STORAGE_KEY = "owner.selectedCourtId";
const COURT_ID_PARAM = "courtId";

function readStoredCourtId(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStoredCourtId(storageKey: string, courtId: string) {
  try {
    if (!courtId) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, courtId);
  } catch {
    // ignore
  }
}

export function useModOwnerCourtFilter(options?: {
  storageKey?: string;
  syncToUrl?: boolean;
}) {
  const storageKey = options?.storageKey ?? DEFAULT_COURT_STORAGE_KEY;
  const syncToUrl = options?.syncToUrl ?? true;

  const [queryCourtId, setQueryCourtId] = useQueryState(
    COURT_ID_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const paramCourtId = syncToUrl ? (queryCourtId ?? "") : "";
  const [courtId, setCourtIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramCourtId) {
      setCourtIdState(paramCourtId);
      writeStoredCourtId(storageKey, paramCourtId);
      return;
    }

    const stored = readStoredCourtId(storageKey);
    setCourtIdState(stored);

    if (stored && syncToUrl && !queryCourtId) {
      setQueryCourtId(stored);
    }
  }, [paramCourtId, queryCourtId, setQueryCourtId, storageKey, syncToUrl]);

  const setCourtId = React.useCallback(
    (nextCourtId: string) => {
      setCourtIdState(nextCourtId);
      writeStoredCourtId(storageKey, nextCourtId);

      if (!syncToUrl) {
        return;
      }

      setQueryCourtId(nextCourtId || null);
    },
    [setQueryCourtId, storageKey, syncToUrl],
  );

  return { courtId, setCourtId };
}

export interface OwnerCourt {
  id: string;
  label: string;
  placeId: string;
  placeSlug?: string | null;
  placeName: string;
  city: string;
  sportId: string;
  sportName: string;
  tierLabel?: string | null;
  coverImageUrl?: string;
  status: "active" | "inactive";
  createdAt: Date | string;
  isActive: boolean;
}

type OwnerPlaceBase = {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
};

type OwnerPlaceSimple = Pick<OwnerPlaceBase, "id" | "slug" | "name" | "city">;

type CourtWithSportPayload = {
  court: {
    id: string;
    label: string;
    placeId: string | null;
    sportId: string;
    tierLabel: string | null;
    isActive: boolean;
    createdAt: string | Date;
  };
  sport: {
    id: string;
    name: string;
  };
};

function mapOwnerCourt(
  court: CourtWithSportPayload,
  place: OwnerPlaceSimple | OwnerPlaceBase,
): OwnerCourt {
  return {
    id: court.court.id,
    label: court.court.label,
    placeId: place.id,
    placeSlug: place.slug ?? null,
    placeName: place.name,
    city: place.city,
    sportId: court.sport.id,
    sportName: court.sport.name,
    tierLabel: court.court.tierLabel,
    coverImageUrl: undefined,
    status: court.court.isActive ? "active" : "inactive",
    createdAt: court.court.createdAt,
    isActive: court.court.isActive,
  };
}

export function useQueryOwnerCourts(organizationId?: string | null) {
  const placesQuery = useFeatureQuery(
    ["placeManagement", "list"],
    ownerApi.queryPlaceManagementList,
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      staleTime: 1000 * 60 * 5,
    },
  );

  const courtQueries = useFeatureQueries(
    (placesQuery.data ?? []).map((place) =>
      createFeatureQueryOptions(
        ["courtManagement", "listByPlace"],
        ownerApi.queryCourtManagementListByPlace,
        { placeId: place.id },
      ),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);

  const data = useMemo(() => {
    if (!placesQuery.data) return [];

    return courtQueries.flatMap((query, index) => {
      const place = placesQuery.data[index];
      if (!place) return [];

      return (query.data ?? []).map((court) => mapOwnerCourt(court, place));
    });
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useQueryOwnerCourt(courtId: string) {
  const courtQuery = useFeatureQuery(
    ["courtManagement", "getById"],
    ownerApi.queryCourtManagementGetById,
    { courtId },
    { enabled: !!courtId },
  );

  const placeId = courtQuery.data?.court.placeId ?? "";

  const placeQuery = useFeatureQuery(
    ["placeManagement", "getById"],
    ownerApi.queryPlaceManagementGetById,
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!courtQuery.data || !placeQuery.data) return null;
    return mapOwnerCourt(courtQuery.data, placeQuery.data.place);
  }, [courtQuery.data, placeQuery.data]);

  return {
    ...courtQuery,
    data,
    isLoading: courtQuery.isLoading || placeQuery.isLoading,
  };
}

export function useMutDeactivateCourt() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutCourtManagementUpdate, {
    onSuccess: async () => {
      await utils.courtManagement.invalidate();
    },
  });
}

export function useMutUploadCourtPhoto(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; image: File }) => ({
      success: true,
    }),
    onSuccess: () => {
      toast.success("Photo uploaded successfully");
    },
  });
}

export function useMutRemoveCourtPhoto(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; photoId: string }) => ({
      success: true,
    }),
    onSuccess: () => {
      toast.success("Photo removed");
    },
  });
}

export function useMutReorderCourtPhotos(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; orderedIds: string[] }) => ({
      success: true,
    }),
  });
}

export function useQueryOwnerCourtById(
  input?: Parameters<typeof ownerApi.queryCourtManagementGetById>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["courtManagement", "getById"],
    ownerApi.queryCourtManagementGetById,
    input,
    options,
  );
}

export function useQueryOwnerSports(
  input?: Parameters<typeof ownerApi.querySportList>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["sport", "list"],
    ownerApi.querySportList,
    input,
    options,
  );
}

export function useQueryOwnerCourtBlocksForRange(
  input?: Parameters<typeof ownerApi.queryCourtBlockListForCourtRange>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["courtBlock", "listForCourtRange"],
    ownerApi.queryCourtBlockListForCourtRange,
    input,
    options,
  );
}

export function useQueryOwnerActiveReservationsForCourtRange(
  input?: Parameters<
    typeof ownerApi.queryReservationOwnerGetActiveForCourtRange
  >[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["reservationOwner", "getActiveForCourtRange"],
    ownerApi.queryReservationOwnerGetActiveForCourtRange,
    input,
    options,
  );
}

export function useMutOwnerCourtBlockUpdateRange(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(ownerApi.mutCourtBlockUpdateRange, options);
}

export function useMutOwnerCourtBlockCreateMaintenance(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(ownerApi.mutCourtBlockCreateMaintenance, options);
}

export function useMutOwnerCourtBlockCreateWalkIn(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(ownerApi.mutCourtBlockCreateWalkIn, options);
}

export function useMutOwnerCourtBlockCancel(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutCourtBlockCancel, options);
}

export function useQueryOwnerGuestProfiles(
  input?: Parameters<typeof ownerApi.queryGuestProfileList>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["guestProfile", "list"],
    ownerApi.queryGuestProfileList,
    input,
    options,
  );
}

export function useMutOwnerGuestProfileCreate(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(ownerApi.mutGuestProfileCreate, options);
}

export function useMutOwnerCreateGuestBooking(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    ownerApi.mutReservationOwnerCreateGuestBooking,
    options,
  );
}

export function useMutOwnerConvertWalkInBlockToGuest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    ownerApi.mutReservationOwnerConvertWalkInBlockToGuest,
    options,
  );
}
