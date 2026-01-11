"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to cancel a reservation
 * Connected to reservation.cancel tRPC endpoint
 */
export function useCancelReservation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.reservation.cancel.mutationOptions({
      onSuccess: (_, variables) => {
        toast.success("Reservation cancelled successfully");
        queryClient.invalidateQueries(
          trpc.reservation.getById.queryFilter({
            reservationId: variables.reservationId,
          }),
        );
        queryClient.invalidateQueries(trpc.reservation.getMy.queryFilter());
        router.push(appRoutes.reservations.base);
      },
      onError: (error) => {
        toast.error("Failed to cancel reservation", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      },
    }),
  );
}
