"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to mark payment as completed for a reservation
 * Connected to reservation.markPayment tRPC endpoint
 */
export function useMarkPayment() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.reservation.markPayment.mutationOptions({
      onSuccess: (data, variables) => {
        const isConfirmed = data.status === "CONFIRMED";
        toast.success(
          isConfirmed
            ? "Reservation confirmed!"
            : "Payment submitted successfully!",
          {
            description: isConfirmed
              ? "Your reservation is confirmed."
              : "The court owner will verify your payment shortly.",
          },
        );
        queryClient.invalidateQueries(
          trpc.reservation.getById.queryFilter({
            reservationId: variables.reservationId,
          }),
        );
        queryClient.invalidateQueries(trpc.reservation.getMy.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit payment");
      },
    }),
  );
}
