"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { CourtFormData } from "../schemas/court-form.schema";

interface CreateCourtResult {
  success: boolean;
  courtId: string;
}

interface UseCourtFormOptions {
  organizationId: string;
  courtId?: string;
  onSuccess?: (result: CreateCourtResult) => void;
}

export function useCourtForm({
  organizationId,
  courtId,
  onSuccess,
}: UseCourtFormOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!courtId;

  const createMutation = useMutation({
    ...trpc.courtManagement.createCourt.mutationOptions(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: trpc.courtManagement.getMyCourts.queryKey(),
      });
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const updateMutation = useMutation({
    ...trpc.courtManagement.update.mutationOptions(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: trpc.courtManagement.getMyCourts.queryKey(),
      });
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const submit = (data: CourtFormData) => {
    if (isEditing && courtId) {
      updateMutation.mutate({
        courtId,
        name: data.name,
        address: data.address,
        city: data.city,
      });
    } else {
      createMutation.mutate({
        organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        defaultPrice: data.isFree ? null : data.defaultHourlyRate,
        currency: data.currency,
      });
    }
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
      queryClient.invalidateQueries({
        queryKey: trpc.courtManagement.getMyCourts.queryKey(),
      });
    },
  });
}
