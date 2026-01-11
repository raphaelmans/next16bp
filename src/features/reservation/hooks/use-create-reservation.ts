"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to create a new reservation
 * Connected to reservation.create tRPC endpoint
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.reservation.create.mutationOptions({
      onSuccess: (data) => {
        const requiresPayment = data.status === "AWAITING_PAYMENT";
        toast.success(
          requiresPayment
            ? "Reservation created! Please complete payment."
            : "Reservation confirmed!",
        );
        queryClient.invalidateQueries(trpc.reservation.getMy.queryFilter());
        queryClient.invalidateQueries(trpc.court.search.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create reservation");
      },
    }),
  );
}
