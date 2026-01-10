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
      onSuccess: (_, variables) => {
        toast.success("Payment submitted successfully!", {
          description: "The court owner will verify your payment shortly.",
        });
        queryClient.invalidateQueries({
          queryKey: ["reservations", variables.reservationId],
        });
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit payment");
      },
    }),
  );
}
