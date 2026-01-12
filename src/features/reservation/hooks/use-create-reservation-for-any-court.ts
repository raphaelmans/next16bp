"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function useCreateReservationForAnyCourt() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.reservation.createForAnyCourt.mutationOptions({
      onSuccess: (data) => {
        const message =
          data.status === "CREATED"
            ? "Reservation request sent!"
            : data.status === "AWAITING_PAYMENT"
              ? "Reservation accepted! Please complete payment."
              : "Reservation confirmed!";
        toast.success(message);
        queryClient.invalidateQueries(trpc.reservation.getMy.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create reservation");
      },
    }),
  );
}
