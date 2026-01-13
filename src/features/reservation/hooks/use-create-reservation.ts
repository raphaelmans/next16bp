"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

/**
 * Hook to create a new reservation
 * Connected to reservation.create tRPC endpoint
 */
export function useCreateReservation() {
  const utils = trpc.useUtils();

  return trpc.reservation.create.useMutation({
    onSuccess: async (data) => {
      const message =
        data.status === "CREATED"
          ? "Reservation request sent!"
          : data.status === "AWAITING_PAYMENT"
            ? "Reservation accepted! Please complete payment."
            : "Reservation confirmed!";
      toast.success(message);
      await utils.reservation.getMy.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create reservation");
    },
  });
}
