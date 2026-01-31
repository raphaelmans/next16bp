import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  AddPaymentProofSchema,
  GetPaymentProofSchema,
  UpdatePaymentProofSchema,
  UploadPaymentProofSchema,
} from "./dtos";
import { makePaymentProofService } from "./factories/payment-proof.factory";

export const paymentProofRouter = router({
  /**
   * Add payment proof to a reservation (URL-based)
   * Protected - requires authentication
   * Only reservation owner can add proof
   */
  add: protectedProcedure
    .input(AddPaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.addPaymentProof(ctx.userId, input);
    }),

  /**
   * Upload payment proof to a reservation (FormData with file)
   * Protected - requires authentication
   * Only reservation owner can upload proof
   */
  upload: protectedRateLimitedProcedure("mutation")
    .input(UploadPaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.uploadPaymentProof(
        ctx.userId,
        input.reservationId,
        input.image,
        input.referenceNumber,
        input.notes,
      );
    }),

  /**
   * Update existing payment proof
   * Protected - requires authentication
   * Only reservation owner can update proof
   */
  update: protectedProcedure
    .input(UpdatePaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.updatePaymentProof(ctx.userId, input);
    }),

  /**
   * Get payment proof for a reservation
   * Protected - requires authentication
   * User must have access to the reservation
   */
  get: protectedProcedure
    .input(GetPaymentProofSchema)
    .query(async ({ input, ctx }) => {
      const service = makePaymentProofService();
      return service.getPaymentProof(ctx.userId, input.reservationId);
    }),
});
