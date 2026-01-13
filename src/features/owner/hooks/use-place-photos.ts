"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

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
