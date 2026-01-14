import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
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
