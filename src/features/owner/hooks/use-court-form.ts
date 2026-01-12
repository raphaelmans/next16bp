"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import type { CourtFormData } from "../schemas/court-form.schema";

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
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const isEditing = !!courtId;

  const createMutation = useMutation({
    mutationFn: async (data: CourtFormData) =>
      trpcClient.courtManagement.create.mutate({
        placeId: data.placeId,
        sportId: data.sportId,
        label: data.label,
        tierLabel: normalizeTierLabel(data.tierLabel),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner-courts"] });
      if (result) {
        onSuccess?.({ success: true, courtId: result.id });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourtFormData) => {
      if (!courtId) {
        throw new Error("Court ID is required to update");
      }

      return trpcClient.courtManagement.update.mutate({
        courtId,
        sportId: data.sportId,
        label: data.label,
        tierLabel: normalizeTierLabel(data.tierLabel),
        isActive: data.isActive,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner-courts"] });
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: Partial<CourtFormData>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId: "draft-court-id" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-courts"] });
    },
  });
}
