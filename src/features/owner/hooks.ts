"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import type { CourtFormData, PlaceFormData } from "./schemas";

// ============================================================================
// From use-court-form.ts
// ============================================================================

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

export function useCourtForm({ courtId, onSuccess }: UseCourtFormOptions) {
  const utils = trpc.useUtils();
  const isEditing = !!courtId;

  const createMutation = trpc.courtManagement.create.useMutation({
    onSuccess: async (result) => {
      await utils.courtManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const updateMutation = trpc.courtManagement.update.useMutation({
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

export function useCourtDraft() {
  return useMutation({
    mutationFn: async (_data: Partial<CourtFormData>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId: "draft-court-id" };
    },
  });
}

// ============================================================================
// From use-court-hours.ts
// ============================================================================

export function useCourtHours(courtId: string) {
  return trpc.courtHours.get.useQuery({ courtId }, { enabled: !!courtId });
}

export function useSaveCourtHours(courtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtHours.set.useMutation({
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId });
    },
  });
}

export function useCopyCourtHours(targetCourtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtHours.copyFromCourt.useMutation({
    onSuccess: async () => {
      await utils.courtHours.get.invalidate({ courtId: targetCourtId });
    },
  });
}

// ============================================================================
// From use-court-photos.ts
// ============================================================================

export function useUploadCourtPhoto(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; image: File }) => ({
      success: true,
    }),
    onSuccess: () => {
      toast.success("Photo uploaded successfully");
    },
  });
}

export function useRemoveCourtPhoto(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; photoId: string }) => ({
      success: true,
    }),
    onSuccess: () => {
      toast.success("Photo removed");
    },
  });
}

export function useReorderCourtPhotos(_courtId: string) {
  return useMutation({
    mutationFn: async (_input: { courtId: string; orderedIds: string[] }) => ({
      success: true,
    }),
  });
}

// ============================================================================
// From use-court-rate-rules.ts
// ============================================================================

export function useCourtRateRules(courtId: string) {
  return trpc.courtRateRule.get.useQuery({ courtId }, { enabled: !!courtId });
}

export function useSaveCourtRateRules(courtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtRateRule.set.useMutation({
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId });
    },
  });
}

export function useCopyCourtRateRules(targetCourtId: string) {
  const utils = trpc.useUtils();

  return trpc.courtRateRule.copyFromCourt.useMutation({
    onSuccess: async () => {
      await utils.courtRateRule.get.invalidate({ courtId: targetCourtId });
    },
  });
}

// ============================================================================
// From use-organization-payment-methods.ts
// ============================================================================

export function useOrganizationPaymentMethods(organizationId?: string) {
  return trpc.organizationPayment.listMethods.useQuery(
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId },
  );
}

export function useCreateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.createMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useUpdateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.updateMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useDeleteOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.deleteMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useSetDefaultOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.setDefault.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

// ============================================================================
// From use-organization.ts
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface UpdateOrganizationData {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Fetch an organization by ID
 */
export function useOrganization(orgId?: string) {
  return trpc.organization.get.useQuery(
    { id: orgId ?? "" },
    { enabled: !!orgId },
  );
}

/**
 * Fetch the current user's organization with profile data
 * Note: organization.my returns OrganizationRecord[] without profile
 * We need to fetch the full org data including profile via organization.get
 */
export function useCurrentOrganization() {
  // First get the list of organizations
  const {
    data: organizations,
    isLoading: listLoading,
    ...rest
  } = trpc.organization.my.useQuery();

  const firstOrgId = organizations?.[0]?.id;

  // Then fetch the first organization with full details including profile
  const { data: fullOrg, isLoading: fullLoading } =
    trpc.organization.get.useQuery(
      { id: firstOrgId ?? "" },
      { enabled: !!firstOrgId },
    );

  const org = fullOrg?.organization;
  const profile = fullOrg?.profile;

  return {
    data: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: profile?.description ?? "",
          logoUrl: profile?.logoUrl ?? undefined,
          email: profile?.contactEmail ?? "",
          phone: profile?.contactPhone ?? "",
          address: profile?.address ?? "",
          createdAt: org.createdAt,
        }
      : null,
    isLoading: listLoading || fullLoading,
    ...rest,
  };
}

/**
 * Update organization details
 * Makes two mutation calls: one for basic info, one for profile
 */
export function useUpdateOrganization() {
  const utils = trpc.useUtils();

  const updateOrgMutation = trpc.organization.update.useMutation();
  const updateProfileMutation = trpc.organization.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.organization.my.invalidate(),
        utils.organization.get.invalidate(),
      ]);
    },
  });

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      await updateOrgMutation.mutateAsync({
        id: data.organizationId,
        name: data.name,
        slug: data.slug,
      });

      await updateProfileMutation.mutateAsync({
        organizationId: data.organizationId,
        description: data.description,
        contactEmail: data.email || null,
        contactPhone: data.phone || null,
        address: data.address || null,
      });

      return { success: true };
    },
  });
}

/**
 * Upload organization logo
 */
export function useUploadOrganizationLogo(organizationId: string) {
  const utils = trpc.useUtils();

  return trpc.organization.uploadLogo.useMutation({
    onSuccess: async () => {
      toast.success("Logo uploaded successfully");
      await Promise.all([
        utils.organization.get.invalidate({ id: organizationId }),
        utils.organization.my.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload logo");
    },
  });
}

export interface RemovalRequestData {
  reason: string;
  acknowledgeReservations: boolean;
  acknowledgeApproval: boolean;
}

/**
 * Request listing removal
 * Keep as mock for now
 */
export function useRequestRemoval() {
  return useMutation({
    mutationFn: async (_data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
  });
}

/**
 * Check if a slug is available
 * Keep as mock for now - could wire to real endpoint
 */
export function useCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}

// ============================================================================
// From use-owner-court-filter.ts
// ============================================================================

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

export function useOwnerCourtFilter(options?: {
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

// ============================================================================
// From use-owner-courts.ts
// ============================================================================

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
  openSlots: number;
  totalSlots: number;
  createdAt: Date | string;
  isActive: boolean;
}

type OwnerPlaceBase = {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  timeZone: string;
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
  place: OwnerPlaceSimple | OwnerPlaceRecord,
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
    openSlots: 0,
    totalSlots: 0,
    createdAt: court.court.createdAt,
    isActive: court.court.isActive,
  };
}

export function useOwnerCourts(organizationId?: string | null) {
  const placesQuery = trpc.placeManagement.list.useQuery(
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      staleTime: 1000 * 60 * 5,
    },
  );

  const courtQueries = trpc.useQueries((t) =>
    (placesQuery.data ?? []).map((place) =>
      t.courtManagement.listByPlace({ placeId: place.id }),
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

export function useOwnerCourt(courtId: string) {
  const courtQuery = trpc.courtManagement.getById.useQuery(
    { courtId },
    { enabled: !!courtId },
  );

  const placeId = courtQuery.data?.court.placeId ?? "";

  const placeQuery = trpc.placeManagement.getById.useQuery(
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

export function useDeactivateCourt() {
  const utils = trpc.useUtils();

  return trpc.courtManagement.update.useMutation({
    onSuccess: async () => {
      await utils.courtManagement.invalidate();
    },
  });
}

// ============================================================================
// From use-owner-dashboard.ts
// ============================================================================

/**
 * Fetch real owner stats from backend.
 * Simplified to only show available data.
 */
export function useOwnerStats(organizationId: string | null) {
  const { data: courts = [], isLoading: courtsLoading } =
    useOwnerCourts(organizationId);

  const { data: pendingCount, isLoading: pendingLoading } =
    trpc.reservationOwner.getPendingCount.useQuery(
      { organizationId: organizationId ?? "" },
      { enabled: !!organizationId },
    );

  return {
    data: {
      activeCourts: courts.filter((court) => court.isActive).length,
      pendingReservations: pendingCount ?? 0,
    },
    isLoading: courtsLoading || pendingLoading,
  };
}

/**
 * Recent activity - returns empty for now (Coming Soon)
 */
export function useRecentActivity() {
  return {
    data: [],
    isLoading: false,
  };
}

/**
 * Today's bookings - returns empty for now (Coming Soon)
 */
export function useTodaysBookings() {
  return {
    data: [],
    isLoading: false,
  };
}

// Keep for backward compatibility but mark as deprecated
/** @deprecated Use useOwnerStats instead */
export function useOwnerDashboard() {
  return useQuery({
    queryKey: ["owner", "dashboard", "deprecated"],
    queryFn: async () => ({
      stats: {
        activeCourts: 0,
        pendingBookings: 0,
        todaysBookings: 0,
        monthlyRevenue: 0,
      },
      recentActivity: [],
      todaysBookings: [],
    }),
  });
}

// ============================================================================
// From use-owner-organization.ts
// ============================================================================

/**
 * Shared hook for fetching the current user's organization.
 * Used across all owner dashboard pages for consistent organization context.
 *
 * Returns the first organization (owners currently can only have one).
 */
export function useOwnerOrganization() {
  const {
    data: organizations,
    isLoading,
    error,
    refetch,
  } = trpc.organization.my.useQuery();

  const organization = organizations?.[0] ?? null;

  return {
    /** The owner's primary organization (or null if none) */
    organization,
    /** Organization ID for use in other queries */
    organizationId: organization?.id ?? null,
    /** All organizations (for future multi-org support) */
    organizations: organizations ?? [],
    /** Whether the query is loading */
    isLoading,
    /** Whether the user is an owner (has at least one organization) */
    isOwner: !!organization,
    /** Query error if any */
    error,
    /** Refetch the organization data */
    refetch,
  };
}

// ============================================================================
// From use-owner-place-filter.ts
// ============================================================================

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

export function useOwnerPlaceFilter(options?: {
  storageKey?: string;
  syncToUrl?: boolean;
}) {
  const storageKey = options?.storageKey ?? DEFAULT_PLACE_STORAGE_KEY;
  const syncToUrl = options?.syncToUrl ?? true;

  const [queryPlaceId, setQueryPlaceId] = useQueryState(
    PLACE_ID_PARAM,
    parseAsString.withOptions({ history: "replace" }),
  );

  const paramPlaceId = syncToUrl ? (queryPlaceId ?? "") : "";
  const [placeId, setPlaceIdState] = React.useState<string>("");

  React.useEffect(() => {
    if (paramPlaceId) {
      setPlaceIdState(paramPlaceId);
      writeStoredPlaceId(storageKey, paramPlaceId);
      return;
    }

    const stored = readStoredPlaceId(storageKey);
    setPlaceIdState(stored);

    if (stored && syncToUrl && !queryPlaceId) {
      setQueryPlaceId(stored);
    }
  }, [paramPlaceId, queryPlaceId, setQueryPlaceId, storageKey, syncToUrl]);

  const setPlaceId = React.useCallback(
    (nextPlaceId: string) => {
      setPlaceIdState(nextPlaceId);
      writeStoredPlaceId(storageKey, nextPlaceId);

      if (!syncToUrl) {
        return;
      }

      setQueryPlaceId(nextPlaceId || null);
    },
    [setQueryPlaceId, storageKey, syncToUrl],
  );

  return { placeId, setPlaceId };
}

// ============================================================================
// From use-owner-places.ts
// ============================================================================

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

type OwnerPlaceRecord = OwnerPlaceBase & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

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
  timeZone: place.timeZone,
  coverImageUrl: undefined,
  courtCount: courts.length,
  sports: mapSports(courts),
  isActive: place.isActive,
  verificationStatus: verification?.status ?? undefined,
  reservationsEnabled: verification?.reservationsEnabled ?? undefined,
});

export function useOwnerPlaces(organizationId?: string | null) {
  const placesQuery = trpc.placeManagement.list.useQuery(
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
    },
  );

  const courtQueries = trpc.useQueries((t) =>
    (placesQuery.data ?? []).map((place) =>
      t.courtManagement.listByPlace({ placeId: place.id }),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);
  const courtData = useMemo(
    () => courtQueries.map((query) => query.data ?? []),
    [courtQueries],
  );

  const data = useMemo(() => {
    if (!placesQuery.data) return [];

    return placesQuery.data.map((place, index) =>
      mapOwnerPlace(place, courtData[index] ?? [], place.verification),
    );
  }, [courtData, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useOwnerPlace(placeId: string) {
  const placeQuery = trpc.placeManagement.getById.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = trpc.courtManagement.listByPlace.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!placeQuery.data) return undefined;
    return mapOwnerPlace(
      { ...placeQuery.data.place, verification: placeQuery.data.verification },
      courtsQuery.data ?? [],
      placeQuery.data.verification,
    );
  }, [courtsQuery.data, placeQuery.data]);

  return {
    ...placeQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}

export function useOwnerCourtsByPlace(placeId: string) {
  const placeQuery = trpc.placeManagement.getById.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const courtsQuery = trpc.courtManagement.listByPlace.useQuery(
    { placeId },
    { enabled: !!placeId },
  );

  const data = useMemo(() => {
    if (!placeQuery.data) return [] as OwnerCourt[];
    return (courtsQuery.data ?? []).map((court) =>
      mapOwnerCourt(court, placeQuery.data.place),
    );
  }, [courtsQuery.data, placeQuery.data]);

  return {
    ...courtsQuery,
    data,
    isLoading: placeQuery.isLoading || courtsQuery.isLoading,
  };
}

// ============================================================================
// From use-owner-reservations.ts
// ============================================================================

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  reservationStatus:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  expiresAt?: string | null;
  paymentProof?: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
  notes?: string;
  createdAt: string;
}

type PaymentProofLike = {
  referenceNumber?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  fileUrl?: string | null;
  file_url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
} | null;

interface UseOwnerReservationsOptions {
  reservationId?: string;
  placeId?: string;
  courtId?: string;
  status?: ReservationStatus | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  refetchIntervalMs?: number;
}

/**
 * Map frontend status to backend enum value
 */
function mapStatusToBackend(
  status?: ReservationStatus,
):
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | undefined {
  if (!status) return undefined;
  if (status === "pending") {
    return undefined;
  }

  const map: Record<
    Exclude<ReservationStatus, "pending">,
    "CONFIRMED" | "EXPIRED" | "CANCELLED"
  > = {
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED", // No separate completed status
  };
  return map[status as Exclude<ReservationStatus, "pending">];
}

/**
 * Map backend status to frontend status
 */
function mapStatusFromBackend(status: string): ReservationStatus {
  const map: Record<string, ReservationStatus> = {
    CREATED: "pending",
    AWAITING_PAYMENT: "pending",
    PAYMENT_MARKED_BY_USER: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    EXPIRED: "cancelled",
  };
  return map[status] ?? "pending";
}

/**
 * Format ISO datetime string to time (e.g., "2:00 PM")
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePaymentProof(
  proof: PaymentProofLike | undefined,
  fallbackCreatedAt?: string | null,
): Reservation["paymentProof"] | null {
  if (!proof) return null;

  const referenceNumber =
    proof.referenceNumber ?? proof.reference_number ?? null;
  const notes = proof.notes ?? null;
  const fileUrl = proof.fileUrl ?? proof.file_url ?? null;
  const createdAt =
    proof.createdAt ?? proof.created_at ?? fallbackCreatedAt ?? null;
  const hasContent = referenceNumber || notes || fileUrl;

  if (!hasContent) return null;

  return {
    referenceNumber,
    notes,
    fileUrl,
    createdAt: createdAt ?? "",
  };
}

/**
 * Fetch reservations for an organization
 * Uses reservationOwner.getForOrganization endpoint
 *
 * Backend returns enriched data with court/slot details.
 */
export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {},
) {
  const {
    courtId,
    dateFrom,
    dateTo,
    status,
    search,
    reservationId,
    refetchIntervalMs,
    placeId,
  } = options;

  return trpc.reservationOwner.getForOrganization.useQuery(
    {
      organizationId: organizationId ?? "",
      reservationId: reservationId || undefined,
      placeId: placeId || undefined,
      courtId: courtId || undefined,
      status:
        status && status !== "all" ? mapStatusToBackend(status) : undefined,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!organizationId,
      refetchInterval: refetchIntervalMs,
      select: (data) => {
        // Map backend records to frontend Reservation format
        let reservations: Reservation[] = data.map((r) => ({
          id: r.id,
          courtId: r.courtId,
          courtName: r.courtName,
          playerName: r.playerNameSnapshot ?? "Unknown",
          playerEmail: r.playerEmailSnapshot ?? "",
          playerPhone: r.playerPhoneSnapshot ?? "",
          // Extract date from slotStartTime
          date: r.slotStartTime
            ? new Date(r.slotStartTime).toISOString().split("T")[0]
            : r.createdAt
              ? new Date(r.createdAt).toISOString().split("T")[0]
              : "",
          startTime: r.slotStartTime ? formatTime(r.slotStartTime) : "--:--",
          endTime: r.slotEndTime ? formatTime(r.slotEndTime) : "--:--",
          slotStartTime: r.slotStartTime ?? null,
          slotEndTime: r.slotEndTime ?? null,
          amountCents: r.amountCents ?? 0,
          currency: r.currency ?? "PHP",
          status: mapStatusFromBackend(r.status),
          reservationStatus: r.status,
          expiresAt: r.expiresAt ?? null,
          paymentProof: normalizePaymentProof(r.paymentProof, r.createdAt),
          notes: r.cancellationReason ?? undefined,
          createdAt: r.createdAt ?? "",
        }));

        if (status === "pending") {
          const pendingStatuses = new Set([
            "CREATED",
            "AWAITING_PAYMENT",
            "PAYMENT_MARKED_BY_USER",
          ]);
          reservations = reservations.filter((reservation) =>
            pendingStatuses.has(reservation.reservationStatus),
          );
        }

        // Apply client-side search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          reservations = reservations.filter(
            (r) =>
              r.playerName.toLowerCase().includes(searchLower) ||
              r.playerEmail.toLowerCase().includes(searchLower) ||
              r.playerPhone.includes(search) ||
              r.courtName.toLowerCase().includes(searchLower),
          );
        }

        if (dateFrom) {
          const from = formatDate(dateFrom);
          reservations = reservations.filter((r) => r.date && r.date >= from);
        }

        if (dateTo) {
          const to = formatDate(dateTo);
          reservations = reservations.filter((r) => r.date && r.date <= to);
        }

        return reservations;
      },
    },
  );
}

/**
 * Accept a reservation (owner review)
 */
export function useAcceptReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.accept.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Confirm payment for a reservation
 */
export function useConfirmReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.confirmPayment.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Reject a reservation
 */
export function useRejectReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.reject.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Get reservation counts
 */
export function useReservationCounts(organizationId: string | null) {
  const { data: pendingCount } = trpc.reservationOwner.getPendingCount.useQuery(
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId },
  );

  return {
    data: {
      pending: pendingCount ?? 0,
      // Other counts would need additional queries or backend support
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: pendingCount ?? 0,
    },
  };
}

// ============================================================================
// From use-owner-setup-status.ts
// ============================================================================

export function useOwnerSetupStatus() {
  return trpc.ownerSetup.getStatus.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// ============================================================================
// From use-owner-sidebar-quick-links.ts
// ============================================================================

export interface OwnerSidebarCourt {
  id: string;
  label: string;
}

export interface OwnerSidebarPlace {
  id: string;
  name: string;
  courts: OwnerSidebarCourt[];
}

type OwnerSidebarPlaceRecord = Pick<OwnerPlaceBase, "id" | "name"> & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

const mapOwnerSidebarPlace = (
  place: OwnerSidebarPlaceRecord,
  courts: CourtWithSportPayload[],
): OwnerSidebarPlace => {
  const activeCourts = courts
    .filter((court) => court.court.isActive)
    .map((court) => ({
      id: court.court.id,
      label: court.court.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    id: place.id,
    name: place.name,
    courts: activeCourts,
  };
};

export function useOwnerSidebarQuickLinks(organizationId?: string | null) {
  const placesQuery = trpc.placeManagement.list.useQuery(
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
    },
  );

  const courtQueries = trpc.useQueries((t) =>
    (placesQuery.data ?? []).map((place) =>
      t.courtManagement.listByPlace({ placeId: place.id }),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);

  const data = useMemo(() => {
    if (!placesQuery.data) return [];

    return placesQuery.data.map((place, index) =>
      mapOwnerSidebarPlace(place, courtQueries[index]?.data ?? []),
    );
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

// ============================================================================
// From use-place-form.ts
// ============================================================================

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

export function usePlaceForm({
  organizationId,
  placeId,
  onSuccess,
}: UsePlaceFormOptions) {
  const utils = trpc.useUtils();
  const isEditing = !!placeId;

  const createMutation = trpc.placeManagement.create.useMutation({
    onSuccess: async (result) => {
      if (organizationId) {
        await utils.placeManagement.list.invalidate({ organizationId });
      }
      await utils.placeManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
      }
    },
  });

  const updateMutation = trpc.placeManagement.update.useMutation({
    onSuccess: async (result) => {
      if (placeId) {
        await utils.placeManagement.getById.invalidate({ placeId });
      }
      await utils.placeManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
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
        country: data.country,
        latitude: formatCoordinate(data.latitude),
        longitude: formatCoordinate(data.longitude),
        timeZone: data.timeZone,
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
      country: data.country ?? "PH",
      latitude,
      longitude,
      timeZone: data.timeZone,
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

// ============================================================================
// From use-place-photos.ts
// ============================================================================

export function useUploadPlacePhoto(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeManagement.uploadPhoto.useMutation({
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

export function useRemovePlacePhoto(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeManagement.removePhoto.useMutation({
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

export function useReorderPlacePhotos(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeManagement.reorderPhotos.useMutation({
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

// ============================================================================
// From use-place-verification.ts
// ============================================================================

export interface UploadPlaceVerificationInput {
  placeId: string;
  documents: File[];
  requestNotes?: string;
}

export type PlaceVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface PlaceVerificationDetails {
  verification: {
    status: PlaceVerificationStatus;
    reservationsEnabled: boolean;
    verifiedAt?: string | null;
    reservationsEnabledAt?: string | null;
  } | null;
  request: {
    id: string;
    status: PlaceVerificationStatus;
    requestNotes?: string | null;
    createdAt: string;
  } | null;
}

export function usePlaceVerification(placeId: string) {
  return trpc.placeVerification.getByPlace.useQuery(
    { placeId },
    {
      enabled: !!placeId,
      select: (data): PlaceVerificationDetails => ({
        verification: data.verification
          ? {
              status: data.verification.status as PlaceVerificationStatus,
              reservationsEnabled: data.verification.reservationsEnabled,
              verifiedAt: data.verification.verifiedAt,
              reservationsEnabledAt: data.verification.reservationsEnabledAt,
            }
          : null,
        request: data.request
          ? {
              id: data.request.id,
              status: data.request.status as PlaceVerificationStatus,
              requestNotes: data.request.requestNotes,
              createdAt: data.request.createdAt,
            }
          : null,
      }),
    },
  );
}

export function useSubmitPlaceVerification(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeVerification.submit.useMutation({
    onSuccess: async () => {
      toast.success("Verification request submitted");
      await Promise.allSettled([
        utils.placeVerification.getByPlace.invalidate({ placeId }),
        utils.placeManagement.getById.invalidate({ placeId }),
        utils.placeManagement.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification request");
    },
  });
}

export const buildPlaceVerificationFormData = (
  input: UploadPlaceVerificationInput,
): FormData => {
  const formData = new FormData();
  formData.append("placeId", input.placeId);
  if (input.requestNotes) {
    formData.append("requestNotes", input.requestNotes);
  }
  input.documents.forEach((file) => {
    formData.append("documents", file, file.name);
  });
  return formData;
};

export function useTogglePlaceReservations(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeVerification.toggleReservations.useMutation({
    onSuccess: async () => {
      await utils.placeVerification.getByPlace.invalidate({ placeId });
      await utils.placeManagement.getById.invalidate({ placeId });
      await utils.placeManagement.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update reservation status");
    },
  });
}

// ============================================================================
// From use-reservation-alerts.ts
// ============================================================================

export function useReservationAlerts(
  organizationId: string | null,
  options: {
    placeId?: string;
    courtId?: string;
  } = {},
) {
  return useOwnerReservations(organizationId, {
    placeId: options.placeId,
    courtId: options.courtId,
    status: "all",
    refetchIntervalMs: 15000,
  });
}
