import {
  router,
  protectedProcedure,
  adminProcedure,
} from "@/shared/infra/trpc/trpc";
import { makeAuditService } from "./factories/audit.factory";
import { GetReservationHistorySchema, GetClaimHistorySchema } from "./dtos";

export const auditRouter = router({
  /**
   * Get reservation history/audit log
   * Protected - requires authentication
   * User must be player, court owner, or admin
   */
  reservationHistory: protectedProcedure
    .input(GetReservationHistorySchema)
    .query(async ({ input, ctx }) => {
      const service = makeAuditService();
      return service.getReservationHistory(ctx.userId, input.reservationId);
    }),

  /**
   * Get claim request history/audit log
   * Admin only
   */
  claimHistory: adminProcedure
    .input(GetClaimHistorySchema)
    .query(async ({ input, ctx }) => {
      const service = makeAuditService();
      return service.getClaimRequestHistory(ctx.userId, input.claimRequestId);
    }),
});
