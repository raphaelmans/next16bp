"use client";

import { trpc } from "@/trpc/client";
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
  const utils = trpc.useUtils();
  const isEditing = !!placeId;

  const createMutation = trpc.placeManagement.create.useMutation({
    onSuccess: async (result) => {
      if (organizationId) {
        await utils.placeManagement.list.invalidate({ organizationId });
      }
      await utils.placeManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
      }
    },
  });

  const updateMutation = trpc.placeManagement.update.useMutation({
    onSuccess: async (result) => {
      if (placeId) {
        await utils.placeManagement.getById.invalidate({ placeId });
      }
      await utils.placeManagement.invalidate();
      if (result) {
        onSuccess?.({ success: true, placeId: result.id });
      }
    },
  });

  const submitAsync = async (data: PlaceFormData) => {
    if (isEditing && placeId) {
      await updateMutation.mutateAsync({
        placeId,
        name: data.name,
        address: data.address,
        city: data.city,
        province: data.province,
        country: data.country,
        latitude: formatCoordinate(data.latitude),
        longitude: formatCoordinate(data.longitude),
        timeZone: data.timeZone,
        isActive: data.isActive,
        websiteUrl: data.websiteUrl || undefined,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        viberInfo: data.viberInfo || undefined,
        otherContactInfo: data.otherContactInfo || undefined,
      });
      return;
    }

    if (!organizationId) {
      throw new Error("Organization is required to create a place");
    }

    const latitude = formatCoordinate(data.latitude);
    const longitude = formatCoordinate(data.longitude);

    await createMutation.mutateAsync({
      organizationId,
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      country: data.country ?? "PH",
      latitude,
      longitude,
      timeZone: data.timeZone,
      websiteUrl: data.websiteUrl || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      viberInfo: data.viberInfo || undefined,
      otherContactInfo: data.otherContactInfo || undefined,
    });
  };

  const submit = (data: PlaceFormData) => {
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
