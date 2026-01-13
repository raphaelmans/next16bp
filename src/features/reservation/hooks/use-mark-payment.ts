"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

/**
 * Hook to mark payment as completed for a reservation
 * Connected to reservation.markPayment tRPC endpoint
 */
export function useMarkPayment() {
  const utils = trpc.useUtils();

  return trpc.reservation.markPayment.useMutation({
    onSuccess: async (data, variables) => {
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

      await Promise.all([
        utils.reservation.getById.invalidate({
          reservationId: variables.reservationId,
        }),
        utils.reservation.getMy.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment");
    },
  });
}
