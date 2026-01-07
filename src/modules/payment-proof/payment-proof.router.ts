import { router, protectedProcedure } from "@/shared/infra/trpc/trpc";
import { makePaymentProofService } from "./factories/payment-proof.factory";
import {
  AddPaymentProofSchema,
  UpdatePaymentProofSchema,
  GetPaymentProofSchema,
} from "./dtos";

export const paymentProofRouter = router({
  /**
   * Add payment proof to a reservation
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
