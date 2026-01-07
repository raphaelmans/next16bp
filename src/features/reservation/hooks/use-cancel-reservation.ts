"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CancelReservationInput {
  reservationId: string;
  reason?: string;
}

/**
 * Hook to cancel a reservation
 * TODO: Connect to actual tRPC endpoint when backend is ready
 */
export function useCancelReservation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, reason }: CancelReservationInput) => {
      // This will be replaced with actual API call
      // await trpc.reservation.cancel.mutate({ reservationId, reason });
      throw new Error("Not implemented");
    },
    onSuccess: (_, variables) => {
      toast.success("Reservation cancelled successfully");
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["reservation", variables.reservationId],
      });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      router.push("/reservations");
    },
    onError: (error) => {
      toast.error("Failed to cancel reservation", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
