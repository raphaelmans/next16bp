"use client";

import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useMemo } from "react";
import {
  createFeatureQueryOptions,
  useFeatureMutation,
  useFeatureQueries,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { DEFAULT_TIME_ZONE } from "@/common/location-defaults";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";
import type { PlaceFormData } from "../schemas";

const ownerApi = getOwnerApi();

const DEFAULT_PLACE_STORAGE_KEY = "owner.selectedPlaceId";
const PLACE_ID_PARAM = "placeId";

function readStoredPlaceId(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStoredPlaceId(storageKey: string, placeId: string) {
  try {
    if (!placeId) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, placeId);
  } catch {
    // ignore
  }
}

export function useModOwnerPlaceFilter(options?: {
  storageKey?: string;
  syncToUrl?: boolean;
  persistToStorage?: boolean;
}) {
  const storageKey = options?.storageKey ?? DEFAULT_PLACE_STORAGE_KEY;
  const syncToUrl = options?.syncToUrl ?? true;
  const persistToStorage = options?.persistToStorage ?? true;

  const [queryPlaceId, setQueryPlaceId] = useQueryState(
    PLACE_ID_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const paramPlaceId = syncToUrl ? (queryPlaceId ?? "") : "";
  const [placeId, setPlaceIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramPlaceId) {
      setPlaceIdState(paramPlaceId);
      if (persistToStorage) {
        writeStoredPlaceId(storageKey, paramPlaceId);
      }
      return;
    }

    if (!persistToStorage) {
      setPlaceIdState("");
      return;
    }

    const stored = readStoredPlaceId(storageKey);
    setPlaceIdState(stored);

    if (stored && syncToUrl && !queryPlaceId) {
      setQueryPlaceId(stored);
    }
  }, [
    paramPlaceId,
    persistToStorage,
    queryPlaceId,
    setQueryPlaceId,
    storageKey,
    syncToUrl,
  ]);

  const setPlaceId = React.useCallback(
    (nextPlaceId: string) => {
      setPlaceIdState(nextPlaceId);
      if (persistToStorage) {
        writeStoredPlaceId(storageKey, nextPlaceId);
      }

      if (!syncToUrl) {
        return;
      }

      setQueryPlaceId(nextPlaceId || null);
    },
    [persistToStorage, setQueryPlaceId, storageKey, syncToUrl],
  );

  return { placeId, setPlaceId };
}

export interface OwnerPlaceSport {
  id: string;
  name: string;
}

export interface OwnerPlace {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  timeZone: string;
  coverImageUrl?: string;
  courtCount: number;
  sports: OwnerPlaceSport[];
  isActive: boolean;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
}

type OwnerPlaceBase = {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  timeZone?: string | null;
  isActive: boolean;
};

interface OwnerCourt {
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

type OwnerPlaceRecord = OwnerPlaceBase & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

type OwnerPlaceByIdResponse = {
  place: OwnerPlaceRecord;
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

const mapOwnerCourt = (
  court: CourtWithSportPayload,
  place: OwnerPlaceRecord,
): OwnerCourt => ({
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
});

const mapSports = (courts: CourtWithSportPayload[]): OwnerPlaceSport[] => {
  const map = new Map<string, OwnerPlaceSport>();
  courts.forEach((court) => {
    map.set(court.sport.id, { id: court.sport.id, name: court.sport.name });
  });
  return Array.from(map.values());
};

const mapOwnerPlace = (
  place: OwnerPlaceRecord,
  courts: CourtWithSportPayload[],
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null,
): OwnerPlace => ({
  id: place.id,
  slug: place.slug,
  name: place.name,
  address: place.address,
  city: place.city,
  timeZone: place.timeZone ?? DEFAULT_TIME_ZONE,
  coverImageUrl: undefined,
  courtCount: courts.length,
  sports: mapSports(courts),
  isActive: place.isActive,
  verificationStatus: verification?.status ?? undefined,
  reservationsEnabled: verification?.reservationsEnabled ?? undefined,
});

export function useQueryOwnerPlaces(organizationId?: string | null) {
  const placesQuery = useFeatureQuery(
    ["placeManagement", "list"],
    ownerApi.queryPlaceManagementList,
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      staleTime: 1000 * 60 * 5,
    },
  );

  const places = (placesQuery.data ?? []) as OwnerPlaceRecord[];
  const courtQueries = useFeatureQueries(
    places.map((place) =>
      createFeatureQueryOptions(
        ["courtManagement", "listByPlace"],
        ownerApi.queryCourtManagementListByPlace,
        { placeId: place.id },
      ),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);
  const courtData = useMemo(
    () =>
      courtQueries.map(
        (query) => (query.data as CourtWithSportPayload[] | undefined) ?? [],
      ),
    [courtQueries],
  );

  const data = useMemo(
    () =>
      places.map((place, index) =>
        mapOwnerPlace(place, courtData[index] ?? [], place.verification),
      ),
    [courtData, places],
  );

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useQueryOwnerPlace(placeId: string) {
  const placeQuery = useFeatureQuery(
    ["placeManagement", "getById"],
    ownerApi.queryPlaceManagementGetById,
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = useFeatureQuery(
    ["courtManagement", "listByPlace"],
    ownerApi.queryCourtManagementListByPlace,
    { placeId },
    { enabled: !!placeId },
  );

  const placePayload = placeQuery.data as OwnerPlaceByIdResponse | undefined;
  const courts =
    (courtsQuery.data as CourtWithSportPayload[] | undefined) ?? [];

  const data = useMemo(() => {
    if (!placePayload) return undefined;
    return mapOwnerPlace(
      { ...placePayload.place, verification: placePayload.verification },
      courts,
      placePayload.verification,
    );
  }, [courts, placePayload]);

  return {
    ...placeQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}

export function useQueryOwnerCourtsByPlace(placeId: string) {
  const placeQuery = useFeatureQuery(
    ["placeManagement", "getById"],
    ownerApi.queryPlaceManagementGetById,
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = useFeatureQuery(
    ["courtManagement", "listByPlace"],
    ownerApi.queryCourtManagementListByPlace,
    { placeId },
    { enabled: !!placeId },
  );

  const placePayload = placeQuery.data as OwnerPlaceByIdResponse | undefined;
  const courts =
    (courtsQuery.data as CourtWithSportPayload[] | undefined) ?? [];

  const data = useMemo(() => {
    if (!placePayload) return [] as OwnerCourt[];
    return courts.map((court) => mapOwnerCourt(court, placePayload.place));
  }, [courts, placePayload]);

  return {
    ...courtsQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}

interface PlaceFormResult {
  success: boolean;
  placeId: string;
}

interface UsePlaceFormOptions {
  organizationId?: string;
  placeId?: string;
  onSuccess?: (result: PlaceFormResult) => void;
}

const formatCoordinate = (value?: number) =>
  value === undefined || Number.isNaN(value) ? undefined : value.toFixed(6);

export function useModPlaceForm({
  organizationId,
  placeId,
  onSuccess,
}: UsePlaceFormOptions) {
  const utils = trpc.useUtils();
  const isEditing = !!placeId;

  const createMutation = useFeatureMutation(ownerApi.mutPlaceManagementCreate, {
    onSuccess: async (result) => {
      if (organizationId) {
        await utils.placeManagement.list.invalidate({ organizationId });
      }
      await utils.placeManagement.invalidate();
      const place = result as { id?: string } | undefined;
      if (place?.id) {
        onSuccess?.({ success: true, placeId: place.id });
      }
    },
  });

  const updateMutation = useFeatureMutation(ownerApi.mutPlaceManagementUpdate, {
    onSuccess: async (result) => {
      if (placeId) {
        await utils.placeManagement.getById.invalidate({ placeId });
      }
      await utils.placeManagement.invalidate();
      const place = result as { id?: string } | undefined;
      if (place?.id) {
        onSuccess?.({ success: true, placeId: place.id });
      }
    },
  });

  const submitAsync = async (data: PlaceFormData) => {
    if (isEditing && placeId) {
      await updateMutation.mutateAsync({
        placeId,
        name: data.name,
        address: data.address,
        city: data.city,
        province: data.province,
        latitude: formatCoordinate(data.latitude),
        longitude: formatCoordinate(data.longitude),
        isActive: data.isActive,
        websiteUrl: data.websiteUrl || undefined,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        phoneNumber: data.phoneNumber || undefined,
        viberInfo: data.viberInfo || undefined,
        otherContactInfo: data.otherContactInfo || undefined,
        amenities: data.amenities,
      });
      return;
    }

    if (!organizationId) {
      throw new Error("Organization is required to create a venue");
    }

    const latitude = formatCoordinate(data.latitude);
    const longitude = formatCoordinate(data.longitude);

    await createMutation.mutateAsync({
      organizationId,
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      latitude,
      longitude,
      websiteUrl: data.websiteUrl || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      phoneNumber: data.phoneNumber || undefined,
      viberInfo: data.viberInfo || undefined,
      otherContactInfo: data.otherContactInfo || undefined,
      amenities: data.amenities.length > 0 ? data.amenities : undefined,
    });
  };

  const submit = (data: PlaceFormData) => {
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

export function useMutUploadPlacePhoto(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceManagementUploadPhoto, {
    onSuccess: async () => {
      toast.success("Photo uploaded successfully");
      await Promise.all([
        utils.placeManagement.getById.invalidate({ placeId }),
        utils.place.getById.invalidate({ placeId }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload photo");
    },
  });
}

export function useMutRemovePlacePhoto(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceManagementRemovePhoto, {
    onSuccess: async () => {
      toast.success("Photo removed");
      await Promise.all([
        utils.placeManagement.getById.invalidate({ placeId }),
        utils.place.getById.invalidate({ placeId }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove photo");
    },
  });
}

export function useMutReorderPlacePhotos(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceManagementReorderPhotos, {
    onSuccess: async () => {
      await Promise.all([
        utils.placeManagement.getById.invalidate({ placeId }),
        utils.place.getById.invalidate({ placeId }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder photos");
    },
  });
}

export function useQueryOwnerPlacesByOrganization(
  input: { organizationId: string },
  options?: { enabled?: boolean },
) {
  return useFeatureQuery(
    ["placeManagement", "list"],
    ownerApi.queryPlaceManagementList,
    input,
    options,
  );
}

export function useQueryOwnerPlaceById(
  input: { placeId: string },
  options?: { enabled?: boolean },
) {
  const query = useFeatureQuery(
    ["placeManagement", "getById"],
    ownerApi.queryPlaceManagementGetById,
    input,
    options,
  );

  const data = useMemo(() => {
    if (!query.data) return undefined;
    const placeWithTimeZone = query.data.place as typeof query.data.place & {
      timeZone?: string | null;
    };
    return {
      ...query.data,
      place: {
        ...placeWithTimeZone,
        timeZone: placeWithTimeZone.timeZone ?? DEFAULT_TIME_ZONE,
      },
    };
  }, [query.data]);

  return {
    ...query,
    data,
  };
}

export function useMutOwnerPlaceDelete(
  options?: Record<string, unknown> & {
    onSuccess?: (...args: unknown[]) => unknown;
  },
) {
  const utils = trpc.useUtils();
  const onSuccess = options?.onSuccess;
  const nextOptions = { ...(options ?? {}) };
  delete nextOptions.onSuccess;

  return useFeatureMutation(ownerApi.mutPlaceManagementDelete, {
    ...nextOptions,
    onSuccess: async (...args: unknown[]) => {
      await utils.placeManagement.invalidate();
      if (onSuccess) {
        await Promise.resolve(onSuccess(...args));
      }
    },
  });
}

export function useQueryOwnerPublicPlaceById(
  input: { placeId: string },
  options?: { enabled?: boolean },
) {
  return useFeatureQuery(
    ["place", "getById"],
    ownerApi.queryPlaceGetById,
    input,
    options,
  );
}
