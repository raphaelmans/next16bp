"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface CreateReservationInput {
  timeSlotId: string;
}

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
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["courts"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create reservation");
      },
    }),
  );
}
