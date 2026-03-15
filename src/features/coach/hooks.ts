"use client";

import { useMemo } from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
  useFeatureQueryCache,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import type { GetCoachReservationsDTO } from "@/lib/modules/reservation/dtos/reservation-coach.dto";
import { getCoachApi } from "./api";

const coachApi = getCoachApi();

export type CoachBlockListRange = {
  startTime: string;
  endTime: string;
};

export function useQueryCoachSetupStatus(options?: { enabled?: boolean }) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coach", "getSetupStatus"],
    coachApi.queryCoachGetSetupStatus,
    undefined,
    {
      enabled: isEnabled,
      staleTime: 0,
      refetchOnMount: "always",
    },
  );
}

export function useQueryCoachMyProfile(options?: { enabled?: boolean }) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coach", "getMyProfile"],
    coachApi.queryCoachGetMyProfile,
    undefined,
    {
      enabled: isEnabled,
      staleTime: 0,
      refetchOnMount: "always",
    },
  );
}

export function useQueryCoachSports(options?: { enabled?: boolean }) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["sport", "list"],
    coachApi.querySportList,
    undefined,
    {
      enabled: isEnabled,
      staleTime: 60_000,
    },
  );
}

export function useModCoachInvalidation() {
  const featureCache = useFeatureQueryCache();

  return useMemo(
    () => ({
      invalidateCoachSetupStatus: () =>
        featureCache.invalidate(["coach", "getSetupStatus"]),
      invalidateCoachProfile: () =>
        featureCache.invalidate(["coach", "getMyProfile"]),
      invalidateCoachPaymentMethods: (coachId: string) =>
        featureCache.invalidate(["coachPayment", "listMethods"], { coachId }),
      invalidateCoachHours: (coachId: string) =>
        featureCache.invalidate(["coachHours", "get"], { coachId }),
      invalidateCoachRateRules: (coachId: string) =>
        featureCache.invalidate(["coachRateRule", "get"], { coachId }),
      invalidateCoachAddons: (coachId: string) =>
        featureCache.invalidate(["coachAddon", "get"], { coachId }),
      invalidateCoachBlocks: (input: {
        coachId: string;
        startTime: string;
        endTime: string;
      }) => featureCache.invalidate(["coachBlock", "list"], input),
    }),
    [featureCache],
  );
}

export function useMutCoachUpdateProfile() {
  const { invalidateCoachProfile, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachUpdateProfile, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachProfile(),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useMutCoachSubmitVerification() {
  const { invalidateCoachProfile, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachSubmitVerification, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachProfile(),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachPaymentMethods(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachPayment", "listMethods"],
    coachApi.queryCoachPaymentListMethods,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCreateCoachPaymentMethod(coachId: string) {
  const { invalidateCoachPaymentMethods, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachPaymentCreateMethod, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachPaymentMethods(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useMutUpdateCoachPaymentMethod(coachId: string) {
  const { invalidateCoachPaymentMethods, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachPaymentUpdateMethod, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachPaymentMethods(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useMutDeleteCoachPaymentMethod(coachId: string) {
  const { invalidateCoachPaymentMethods, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachPaymentDeleteMethod, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachPaymentMethods(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useMutSetDefaultCoachPaymentMethod(coachId: string) {
  const { invalidateCoachPaymentMethods, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachPaymentSetDefault, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachPaymentMethods(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachHours(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachHours", "get"],
    coachApi.queryCoachHoursGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetHours(coachId: string) {
  const { invalidateCoachHours, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachHoursSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachHours(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachBlocks(
  coachId: string | null,
  range: CoachBlockListRange,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachBlock", "list"],
    coachApi.queryCoachBlockList,
    coachId ? { coachId, ...range } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachCreateBlock(range: CoachBlockListRange) {
  const { invalidateCoachBlocks } = useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachBlockCreate, {
    onSuccess: async (_, variables) => {
      if (!variables) return;
      await invalidateCoachBlocks({
        coachId: variables.coachId,
        ...range,
      });
    },
  });
}

export function useMutCoachDeleteBlock(range: CoachBlockListRange) {
  const { invalidateCoachBlocks } = useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachBlockDelete, {
    onSuccess: async (_, variables) => {
      if (!variables) return;
      await invalidateCoachBlocks({
        coachId: variables.coachId,
        ...range,
      });
    },
  });
}

export function useQueryCoachRateRules(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachRateRule", "get"],
    coachApi.queryCoachRateRuleGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetRateRules(coachId: string) {
  const { invalidateCoachRateRules, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachRateRuleSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachRateRules(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

export function useQueryCoachAddons(
  coachId: string | null,
  options?: {
    enabled?: boolean;
  },
) {
  const isEnabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["coachAddon", "get"],
    coachApi.queryCoachAddonGet,
    coachId ? { coachId } : undefined,
    {
      enabled: !!coachId && isEnabled,
    },
  );
}

export function useMutCoachSetAddons(coachId: string) {
  const { invalidateCoachAddons, invalidateCoachSetupStatus } =
    useModCoachInvalidation();

  return useFeatureMutation(coachApi.mutCoachAddonSet, {
    onSuccess: async () => {
      await Promise.all([
        invalidateCoachAddons(coachId),
        invalidateCoachSetupStatus(),
      ]);
    },
  });
}

// ─── Coach Reservation Hooks ────────────────────────────────────────────────

export function useQueryCoachReservations(
  filters: Omit<GetCoachReservationsDTO, "limit" | "offset"> &
    Partial<Pick<GetCoachReservationsDTO, "limit" | "offset">>,
) {
  const normalizedFilters: GetCoachReservationsDTO = {
    limit: filters.limit ?? 20,
    offset: filters.offset ?? 0,
    ...filters,
  };

  return useFeatureQuery(
    ["reservationCoach", "getForCoach"],
    coachApi.queryReservationCoachGetForCoach,
    normalizedFilters,
    {
      staleTime: 10_000,
      refetchOnMount: "always",
    },
  );
}

export function useQueryCoachReservationDetail(reservationId: string | null) {
  return useFeatureQuery(
    ["reservationCoach", "getDetail"],
    coachApi.queryReservationCoachGetDetail,
    reservationId ? { reservationId } : undefined,
    {
      enabled: !!reservationId,
      staleTime: 5_000,
    },
  );
}

export function useQueryCoachPendingCount() {
  return useFeatureQuery(
    ["reservationCoach", "getPendingCount"],
    coachApi.queryReservationCoachGetPendingCount,
    undefined,
    {
      staleTime: 15_000,
      refetchInterval: 30_000,
    },
  );
}

function useCoachReservationInvalidation() {
  const featureCache = useFeatureQueryCache();

  return useMemo(
    () => ({
      invalidateCoachReservations: () =>
        featureCache.invalidate(["reservationCoach", "getForCoach"]),
      invalidateCoachReservationDetail: (reservationId: string) =>
        featureCache.invalidate(["reservationCoach", "getDetail"], {
          reservationId,
        }),
      invalidateCoachPendingCount: () =>
        featureCache.invalidate(["reservationCoach", "getPendingCount"]),
      invalidateAll: (reservationId?: string) =>
        Promise.all([
          featureCache.invalidate(["reservationCoach", "getForCoach"]),
          featureCache.invalidate(["reservationCoach", "getPendingCount"]),
          reservationId
            ? featureCache.invalidate(["reservationCoach", "getDetail"], {
                reservationId,
              })
            : Promise.resolve(),
        ]),
    }),
    [featureCache],
  );
}

export function useMutCoachAcceptReservation() {
  const { invalidateAll } = useCoachReservationInvalidation();

  return useFeatureMutation(coachApi.mutReservationCoachAccept, {
    onSuccess: async (_, variables) => {
      toast.success("Reservation accepted");
      if (!variables) return;
      await invalidateAll(variables.reservationId);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to accept reservation");
    },
  });
}

export function useMutCoachRejectReservation() {
  const { invalidateAll } = useCoachReservationInvalidation();

  return useFeatureMutation(coachApi.mutReservationCoachReject, {
    onSuccess: async (_, variables) => {
      toast.success("Reservation rejected");
      if (!variables) return;
      await invalidateAll(variables.reservationId);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to reject reservation");
    },
  });
}

export function useMutCoachConfirmPayment() {
  const { invalidateAll } = useCoachReservationInvalidation();

  return useFeatureMutation(coachApi.mutReservationCoachConfirmPayment, {
    onSuccess: async (_, variables) => {
      toast.success("Payment confirmed");
      if (!variables) return;
      await invalidateAll(variables.reservationId);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to confirm payment");
    },
  });
}

export function useMutCoachCancelReservation() {
  const { invalidateAll } = useCoachReservationInvalidation();

  return useFeatureMutation(coachApi.mutReservationCoachCancel, {
    onSuccess: async (_, variables) => {
      toast.success("Reservation cancelled");
      if (!variables) return;
      await invalidateAll(variables.reservationId);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to cancel reservation");
    },
  });
}
