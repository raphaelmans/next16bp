"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export interface UploadPlaceVerificationInput {
  placeId: string;
  documents: File[];
  requestNotes?: string;
}

export type PlaceVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface PlaceVerificationDetails {
  verification: {
    status: PlaceVerificationStatus;
    reservationsEnabled: boolean;
    verifiedAt?: string | null;
    reservationsEnabledAt?: string | null;
  } | null;
  request: {
    id: string;
    status: PlaceVerificationStatus;
    requestNotes?: string | null;
    createdAt: string;
  } | null;
}

export function useQueryPlaceVerification(placeId: string) {
  return useFeatureQuery(
    ["placeVerification", "getByPlace"],
    ownerApi.queryPlaceVerificationGetByPlace,
    { placeId },
    {
      enabled: !!placeId,
      select: (data): PlaceVerificationDetails => ({
        verification: data.verification
          ? {
              status: data.verification.status as PlaceVerificationStatus,
              reservationsEnabled: data.verification.reservationsEnabled,
              verifiedAt: data.verification.verifiedAt,
              reservationsEnabledAt: data.verification.reservationsEnabledAt,
            }
          : null,
        request: data.request
          ? {
              id: data.request.id,
              status: data.request.status as PlaceVerificationStatus,
              requestNotes: data.request.requestNotes,
              createdAt: data.request.createdAt,
            }
          : null,
      }),
    },
  );
}

export function useMutSubmitPlaceVerification(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceVerificationSubmit, {
    onSuccess: async () => {
      toast.success("Verification request submitted");
      await Promise.allSettled([
        utils.placeVerification.getByPlace.invalidate({ placeId }),
        utils.placeManagement.getById.invalidate({ placeId }),
        utils.placeManagement.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification request");
    },
  });
}

export const buildPlaceVerificationFormData = (
  input: UploadPlaceVerificationInput,
): FormData => {
  const formData = new FormData();
  formData.append("placeId", input.placeId);
  if (input.requestNotes) {
    formData.append("requestNotes", input.requestNotes);
  }
  input.documents.forEach((file) => {
    formData.append("documents", file, file.name);
  });
  return formData;
};

export function useMutTogglePlaceReservations(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutPlaceVerificationToggleReservations, {
    onSuccess: async () => {
      await utils.placeVerification.getByPlace.invalidate({ placeId });
      await utils.placeManagement.getById.invalidate({ placeId });
      await utils.placeManagement.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update reservation status");
    },
  });
}

export function useModOwnerPlaceVerificationPostSubmit() {
  const utils = trpc.useUtils();

  return {
    fetchCourtsByPlace: async (placeId: string) =>
      utils.courtManagement.listByPlace.fetch({ placeId }).catch(() => null),
  };
}

export function useQueryOwnerClaimRequests(
  input?: Parameters<typeof ownerApi.queryClaimRequestGetMy>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["claimRequest", "getMy"],
    ownerApi.queryClaimRequestGetMy,
    input,
    options,
  );
}

export function useQueryOwnerClaimRequestById(
  input?: Parameters<typeof ownerApi.queryClaimRequestGetById>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["claimRequest", "getById"],
    ownerApi.queryClaimRequestGetById,
    input,
    options,
  );
}

export function useQueryOwnerClaimablePlaces(
  input?: Parameters<typeof ownerApi.queryPlaceList>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["place", "list"],
    ownerApi.queryPlaceList,
    input,
    options,
  );
}

export function useMutOwnerSubmitClaim(options?: Record<string, unknown>) {
  return useFeatureMutation(ownerApi.mutClaimRequestSubmitClaim, options);
}
