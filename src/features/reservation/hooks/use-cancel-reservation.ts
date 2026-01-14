"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/shared/lib/app-routes";
import { trpc } from "@/trpc/client";

/**
 * Hook to cancel a reservation
 * Connected to reservation.cancel tRPC endpoint
 */
export function useCancelReservation() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return trpc.reservation.cancel.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Reservation cancelled successfully");

      await Promise.all([
        utils.reservation.getById.invalidate({
          reservationId: variables.reservationId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
      ]);

      router.push(appRoutes.reservations.base);
    },
    onError: (error) => {
      toast.error("Failed to cancel reservation", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
