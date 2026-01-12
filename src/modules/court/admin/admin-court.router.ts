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
   * Create a new curated place
   * Admin only + rate limited
   */
  createCurated: adminRateLimitedProcedure("mutation")
    .input(CreateCuratedCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.createCuratedPlace(ctx.userId, input);
    }),

  /**
   * Update any place
   * Admin only
   */
  update: adminProcedure
    .input(AdminUpdateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.updatePlace(ctx.userId, input);
    }),

  /**
   * Deactivate a place
   * Admin only
   */
  deactivate: adminProcedure
    .input(DeactivateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.deactivatePlace(ctx.userId, input.placeId, input.reason);
    }),

  /**
   * Activate a place
   * Admin only
   */
  activate: adminProcedure
    .input(ActivateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.activatePlace(ctx.userId, input.placeId);
    }),

  /**
   * List all places with filters (admin view)
   * Admin only
   */
  list: adminProcedure
    .input(AdminCourtFiltersSchema)
    .query(async ({ input }) => {
      const service = makeAdminCourtService();
      return service.listAllPlaces(input);
    }),
});
