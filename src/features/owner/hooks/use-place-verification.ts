"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

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

export function usePlaceVerification(placeId: string) {
  return trpc.placeVerification.getByPlace.useQuery(
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

export function useSubmitPlaceVerification(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeVerification.submit.useMutation({
    onSuccess: async () => {
      toast.success("Verification request submitted");
      await utils.placeVerification.getByPlace.invalidate({ placeId });
      await utils.placeManagement.getById.invalidate({ placeId });
      await utils.placeManagement.invalidate();
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

export function useTogglePlaceReservations(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.placeVerification.toggleReservations.useMutation({
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
