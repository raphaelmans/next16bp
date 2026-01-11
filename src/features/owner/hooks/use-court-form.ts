"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import type { CourtFormData } from "../schemas/court-form.schema";

interface CreateCourtResult {
  success: boolean;
  courtId: string;
}

interface UseCourtFormOptions {
  organizationId: string;
  courtId?: string;
  initialAmenities?: { id: string; name: string }[];
  onSuccess?: (result: CreateCourtResult) => void;
}

export function useCourtForm({
  organizationId,
  courtId,
  initialAmenities,
  onSuccess,
}: UseCourtFormOptions) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const isEditing = !!courtId;

  const formatCoordinate = (value?: number) =>
    value === undefined || Number.isNaN(value) ? undefined : value.toFixed(6);

  const toPriceCents = (value?: number) =>
    value === undefined || Number.isNaN(value) ? null : Math.round(value * 100);

  const resolveDefaultPriceCents = (data: CourtFormData) =>
    data.isFree ? null : toPriceCents(data.defaultHourlyRate);

  const createMutation = useMutation({
    mutationFn: async (data: CourtFormData) =>
      trpcClient.courtManagement.createReservable.mutate({
        organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: formatCoordinate(data.latitude) ?? "0.0",
        longitude: formatCoordinate(data.longitude) ?? "0.0",
        isFree: data.isFree,
        defaultPriceCents: resolveDefaultPriceCents(data),
        defaultCurrency: data.currency,
        requiresOwnerConfirmation: data.requiresOwnerConfirmation,
        paymentHoldMinutes: data.paymentHoldMinutes,
        ownerReviewMinutes: data.ownerReviewMinutes,
        cancellationCutoffMinutes: data.cancellationCutoffMinutes,
        paymentInstructions: data.paymentInstructions?.trim() || undefined,
        gcashNumber: data.gcashEnabled
          ? data.gcashNumber || undefined
          : undefined,
        bankName: data.bankTransferEnabled
          ? data.bankName || undefined
          : undefined,
        bankAccountNumber: data.bankTransferEnabled
          ? data.bankAccountNumber || undefined
          : undefined,
        bankAccountName: data.bankTransferEnabled
          ? data.bankAccountName || undefined
          : undefined,
        photos: data.photos?.length ? data.photos : undefined,
        amenities: data.amenities?.length ? data.amenities : undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries(
        trpc.courtManagement.getMyCourts.queryFilter(),
      );
      if (result) {
        onSuccess?.({ success: true, courtId: result.court.id });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourtFormData) => {
      if (!courtId) {
        throw new Error("Court ID is required to update");
      }

      const latitude = formatCoordinate(data.latitude);
      const longitude = formatCoordinate(data.longitude);

      const amenityOperations: Promise<unknown>[] = [];
      if (initialAmenities) {
        const amenityMap = new Map(
          initialAmenities.map((amenity) => [amenity.name, amenity.id]),
        );
        const nextAmenities = data.amenities ?? [];
        const amenitiesToAdd = nextAmenities.filter(
          (name) => !amenityMap.has(name),
        );
        const amenitiesToRemove = [...amenityMap.keys()].filter(
          (name) => !nextAmenities.includes(name),
        );

        amenityOperations.push(
          ...amenitiesToAdd.map((name) =>
            trpcClient.courtManagement.addAmenity.mutate({ courtId, name }),
          ),
        );
        amenitiesToRemove.forEach((name) => {
          const amenityId = amenityMap.get(name);
          if (!amenityId) return;
          amenityOperations.push(
            trpcClient.courtManagement.removeAmenity.mutate({
              courtId,
              amenityId,
            }),
          );
        });
      }

      const [updatedCourt] = await Promise.all([
        trpcClient.courtManagement.update.mutate({
          courtId,
          name: data.name,
          address: data.address,
          city: data.city,
          ...(latitude ? { latitude } : {}),
          ...(longitude ? { longitude } : {}),
        }),
        trpcClient.courtManagement.updateDetail.mutate({
          courtId,
          isFree: data.isFree,
          defaultPriceCents: resolveDefaultPriceCents(data),
          defaultCurrency: data.currency,
          requiresOwnerConfirmation: data.requiresOwnerConfirmation,
          paymentHoldMinutes: data.paymentHoldMinutes,
          ownerReviewMinutes: data.ownerReviewMinutes,
          cancellationCutoffMinutes: data.cancellationCutoffMinutes,
          paymentInstructions: data.paymentInstructions?.trim() || null,
          gcashNumber: data.gcashEnabled ? data.gcashNumber || null : null,
          bankName: data.bankTransferEnabled ? data.bankName || null : null,
          bankAccountNumber: data.bankTransferEnabled
            ? data.bankAccountNumber || null
            : null,
          bankAccountName: data.bankTransferEnabled
            ? data.bankAccountName || null
            : null,
        }),
        ...amenityOperations,
      ]);

      return updatedCourt;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(
        trpc.courtManagement.getMyCourts.queryFilter(),
      );
      if (courtId) {
        queryClient.invalidateQueries(
          trpc.courtManagement.getById.queryFilter({ courtId }),
        );
      }
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const submit = (data: CourtFormData) => {
    if (isEditing && courtId) {
      updateMutation.mutate(data);
      return;
    }

    createMutation.mutate(data);
  };

  return {
    submit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
    isEditing,
  };
}

export function useCourtDraft() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: Partial<CourtFormData>) => {
      // Draft saving is not yet implemented on the backend
      // For now, just simulate the operation
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId: "draft-court-id" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.courtManagement.getMyCourts.queryFilter(),
      );
    },
  });
}
