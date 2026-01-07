import { router, protectedProcedure } from "@/shared/infra/trpc/trpc";
import { makeClaimRequestService } from "./factories/claim-request.factory";
import {
  SubmitClaimRequestSchema,
  SubmitRemovalRequestSchema,
  CancelClaimRequestSchema,
  GetClaimRequestByIdSchema,
} from "./dtos";

export const claimRequestRouter = router({
  /**
   * Submit a claim request for a curated court
   * Protected - requires authentication
   * User must own the organization
   */
  submitClaim: protectedProcedure
    .input(SubmitClaimRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimRequestService();
      return service.submitClaimRequest(ctx.userId, input);
    }),

  /**
   * Submit a removal request for a claimed court
   * Protected - requires authentication
   * User must own the organization that owns the court
   */
  submitRemoval: protectedProcedure
    .input(SubmitRemovalRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimRequestService();
      return service.submitRemovalRequest(ctx.userId, input);
    }),

  /**
   * Cancel a pending claim request
   * Protected - requires authentication
   * Only the requester can cancel
   */
  cancel: protectedProcedure
    .input(CancelClaimRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimRequestService();
      return service.cancelRequest(ctx.userId, input.requestId);
    }),

  /**
   * Get all claim requests submitted by the current user
   * Protected - requires authentication
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const service = makeClaimRequestService();
    return service.getMyClaimRequests(ctx.userId);
  }),

  /**
   * Get a claim request by ID with details
   * Protected - requires authentication
   * User must be the requester
   */
  getById: protectedProcedure
    .input(GetClaimRequestByIdSchema)
    .query(async ({ input, ctx }) => {
      const service = makeClaimRequestService();
      return service.getClaimRequestById(ctx.userId, input.id);
    }),
});
