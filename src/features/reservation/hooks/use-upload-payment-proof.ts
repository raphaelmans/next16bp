"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

/**
 * Hook to upload payment proof for a reservation
 * Connected to paymentProof.upload tRPC endpoint
 */
export function useUploadPaymentProof() {
  const utils = trpc.useUtils();

  return trpc.paymentProof.upload.useMutation({
    onSuccess: async () => {
      toast.success("Payment proof uploaded successfully!", {
        description: "The court owner will review your payment shortly.",
      });

      await utils.reservation.getMy.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload payment proof");
    },
  });
}
