import {
  router,
  adminProcedure,
  adminRateLimitedProcedure,
} from "@/shared/infra/trpc/trpc";
import { makeClaimAdminService } from "../factories/claim-request.factory";
import {
  GetClaimRequestByIdSchema,
  ListPendingClaimsSchema,
  ApproveClaimRequestSchema,
  RejectClaimRequestSchema,
} from "../dtos";

export const claimAdminRouter = router({
  /**
   * Get all pending claim requests (paginated)
   * Admin only
   */
  getPending: adminProcedure
    .input(ListPendingClaimsSchema)
    .query(async ({ input }) => {
      const service = makeClaimAdminService();
      return service.getPendingClaimRequests({
        limit: input.limit,
        offset: input.offset,
      });
    }),

  /**
   * Get a claim request by ID with full details
   * Admin only
   */
  getById: adminProcedure
    .input(GetClaimRequestByIdSchema)
    .query(async ({ input }) => {
      const service = makeClaimAdminService();
      return service.getClaimRequestById(input.id);
    }),

  /**
   * Approve a claim request
   * Admin only + rate limited
   * Transforms curated court to reservable court
   */
  approve: adminRateLimitedProcedure("mutation")
    .input(ApproveClaimRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimAdminService();
      return service.approveClaimRequest(
        ctx.userId,
        input.requestId,
        input.reviewNotes,
      );
    }),

  /**
   * Reject a claim request
   * Admin only + rate limited
   * Reverts court status to previous state
   */
  reject: adminRateLimitedProcedure("mutation")
    .input(RejectClaimRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeClaimAdminService();
      return service.rejectClaimRequest(
        ctx.userId,
        input.requestId,
        input.reviewNotes,
      );
    }),
});
