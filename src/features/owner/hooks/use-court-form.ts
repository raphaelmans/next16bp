"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CourtFormData } from "../schemas/court-form.schema";

interface CreateCourtResult {
  success: boolean;
  courtId: string;
}

interface UseCourtFormOptions {
  courtId?: string;
  onSuccess?: (result: CreateCourtResult) => void;
}

export function useCourtForm({ courtId, onSuccess }: UseCourtFormOptions = {}) {
  const queryClient = useQueryClient();
  const isEditing = !!courtId;

  const mutation = useMutation({
    mutationFn: async (data: CourtFormData) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Replace with actual tRPC mutation
      // if (isEditing) {
      //   return trpc.courtManagement.update.mutate({ id: courtId, ...data });
      // }
      // return trpc.courtManagement.create.mutate(data);

      return { success: true, courtId: courtId ?? "new-court-id" };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner", "courts"] });
      onSuccess?.(result);
    },
  });

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    isEditing,
  };
}

export function useCourtDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CourtFormData>) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // TODO: Replace with actual tRPC mutation
      // return trpc.courtManagement.saveDraft.mutate(data);

      return { success: true, courtId: "draft-court-id" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "courts"] });
    },
  });
}
