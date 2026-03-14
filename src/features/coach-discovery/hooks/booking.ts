"use client";

import { useFeatureMutation } from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { useModReservationSync } from "@/features/reservation/sync";
import { getCoachDiscoveryApi } from "../api.runtime";

const api = getCoachDiscoveryApi();

export function useMutCreateReservationForCoach() {
  const { syncPlayerReservationChange } = useModReservationSync();

  return useFeatureMutation(api.mutReservationCreateForCoach, {
    onSuccess: async (data) => {
      toast.success("Booking request sent!", {
        description:
          "The coach will review your request. You will be notified once they respond.",
      });
      await syncPlayerReservationChange({ reservationId: data.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create booking");
    },
  });
}
