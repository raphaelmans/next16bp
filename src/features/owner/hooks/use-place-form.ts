"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import type { PlaceFormData } from "../schemas/place-form.schema";

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
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const isEditing = !!placeId;

  const createMutation = useMutation({
    mutationFn: async (data: PlaceFormData) => {
      if (!organizationId) {
        throw new Error("Organization is required to create a place");
      }
      const latitude = formatCoordinate(data.latitude) ?? "0.0";
      const longitude = formatCoordinate(data.longitude) ?? "0.0";
      return trpcClient.placeManagement.create.mutate({
        organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        latitude,
        longitude,
        timeZone: data.timeZone,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner-places"] });
      if (organizationId) {
        queryClient.invalidateQueries(
          trpc.placeManagement.list.queryFilter({ organizationId }),
        );
      }
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PlaceFormData) => {
      if (!placeId) {
        throw new Error("Place ID is required to update");
      }

      return trpcClient.placeManagement.update.mutate({
        placeId,
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: formatCoordinate(data.latitude),
        longitude: formatCoordinate(data.longitude),
        timeZone: data.timeZone,
        isActive: data.isActive,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner-places"] });
      if (placeId) {
        queryClient.invalidateQueries(
          trpc.placeManagement.getById.queryFilter({ placeId }),
        );
      }
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
      }
    },
  });

  const submit = (data: PlaceFormData) => {
    if (isEditing && placeId) {
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
