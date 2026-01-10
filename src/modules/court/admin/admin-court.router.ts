import {
  adminProcedure,
  adminRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import {
  ActivateCourtSchema,
  AdminCourtFiltersSchema,
  AdminUpdateCourtSchema,
  CreateCuratedCourtSchema,
  DeactivateCourtSchema,
} from "../dtos";
import { makeAdminCourtService } from "../factories/court.factory";

export const adminCourtRouter = router({
  /**
   * Create a new curated court
   * Admin only + rate limited
   */
  createCurated: adminRateLimitedProcedure("mutation")
    .input(CreateCuratedCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.createCuratedCourt(ctx.userId, input);
    }),

  /**
   * Update any court
   * Admin only
   */
  update: adminProcedure
    .input(AdminUpdateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.updateCourt(ctx.userId, input);
    }),

  /**
   * Deactivate a court
   * Admin only
   */
  deactivate: adminProcedure
    .input(DeactivateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.deactivateCourt(ctx.userId, input.courtId, input.reason);
    }),

  /**
   * Activate a court
   * Admin only
   */
  activate: adminProcedure
    .input(ActivateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.activateCourt(ctx.userId, input.courtId);
    }),

  /**
   * List all courts with filters (admin view)
   * Admin only
   */
  list: adminProcedure
    .input(AdminCourtFiltersSchema)
    .query(async ({ input }) => {
      const service = makeAdminCourtService();
      return service.listAllCourts(input);
    }),
});
