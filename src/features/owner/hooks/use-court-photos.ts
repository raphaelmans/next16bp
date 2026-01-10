"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to upload a photo to a court
 */
export function useUploadCourtPhoto(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.courtManagement.uploadPhoto.mutationOptions({
      onSuccess: () => {
        toast.success("Photo uploaded successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.courtManagement.getById.queryKey({ courtId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload photo");
      },
    }),
  );
}

/**
 * Hook to remove a photo from a court
 */
export function useRemoveCourtPhoto(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.courtManagement.removePhoto.mutationOptions({
      onSuccess: () => {
        toast.success("Photo removed");
        queryClient.invalidateQueries({
          queryKey: trpc.courtManagement.getById.queryKey({ courtId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove photo");
      },
    }),
  );
}

/**
 * Hook to reorder photos
 */
export function useReorderCourtPhotos(courtId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.courtManagement.reorderPhotos.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.courtManagement.getById.queryKey({ courtId }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reorder photos");
      },
    }),
  );
}
