import {
  adminProcedure,
  adminRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  ApproveClaimRequestSchema,
  GetClaimRequestByIdSchema,
  ListPendingClaimsSchema,
  RejectClaimRequestSchema,
} from "../dtos";
import { makeClaimAdminService } from "../factories/claim-request.factory";

function redactPlaceLocale<T extends { country?: string; timeZone?: string }>(
  place: T,
): Omit<T, "country" | "timeZone"> {
  const { country: _country, timeZone: _timeZone, ...rest } = place;
  return rest;
}

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
   * Get count of pending claim requests
   * Admin only - useful for sidebar badge
   */
  getPendingCount: adminProcedure.query(async () => {
    const service = makeClaimAdminService();
    return service.getPendingCount();
  }),

  /**
   * Get a claim request by ID with full details
   * Admin only
   */
  getById: adminProcedure
    .input(GetClaimRequestByIdSchema)
    .query(async ({ input }) => {
      const service = makeClaimAdminService();
      const details = await service.getClaimRequestById(input.id);
      return {
        ...details,
        place: redactPlaceLocale(details.place),
      };
    }),

  /**
   * Approve a claim request
   * Admin only + rate limited
   * Applies approved ownership transition for the request type
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
