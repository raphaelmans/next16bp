import { logger } from "@/lib/shared/infra/logger";
import {
  protectedProcedure,
  rateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { makeSupportChatService } from "../chat/factories/support-chat.factory";
import {
  CancelClaimRequestSchema,
  GetClaimRequestByIdSchema,
  SubmitClaimRequestSchema,
  SubmitGuestRemovalRequestSchema,
  SubmitRemovalRequestSchema,
} from "./dtos";
import { makeClaimRequestService } from "./factories/claim-request.factory";

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
      const claimRequest = await service.submitClaimRequest(ctx.userId, input);

      const supportChatService = makeSupportChatService();
      try {
        await supportChatService.provisionClaimThread({
          claimRequestId: claimRequest.id,
          createdByUserId: ctx.userId,
        });
      } catch (error) {
        logger.warn(
          {
            event: "claim_support_chat.provision_failed",
            claimRequestId: claimRequest.id,
            userId: ctx.userId,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to auto-provision claim support chat",
        );
      }

      return claimRequest;
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
   * Submit a removal request for a curated place (guest)
   * Public + rate limited
   */
  submitGuestRemoval: rateLimitedProcedure("sensitive")
    .input(SubmitGuestRemovalRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimRequestService();
      return service.submitGuestRemovalRequest(input, {
        requestId: ctx.requestId,
      });
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
