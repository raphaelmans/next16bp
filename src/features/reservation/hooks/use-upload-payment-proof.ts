"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/**
 * Hook to upload payment proof for a reservation
 * Connected to paymentProof.upload tRPC endpoint
 */
export function useUploadPaymentProof() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.paymentProof.upload.mutationOptions({
      onSuccess: () => {
        toast.success("Payment proof uploaded successfully!", {
          description: "The court owner will review your payment shortly.",
        });
        // Invalidate all reservation queries
        queryClient.invalidateQueries(trpc.reservation.getMy.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload payment proof");
      },
    }),
  );
}
