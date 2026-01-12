"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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
