import {
  adminProcedure,
  adminRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import {
  ActivateCourtSchema,
  AdminCourtDetailSchema,
  AdminCourtFiltersSchema,
  AdminDeletePlaceSchema,
  AdminUpdateCourtSchema,
  CreateCuratedCourtBatchSchema,
  CreateCuratedCourtSchema,
  DeactivateCourtSchema,
  RemoveCourtPhotoSchema,
  TransferPlaceSchema,
  UploadCourtPhotoSchema,
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
   * Create curated places in batch
   * Admin only + rate limited
   */
  createCuratedBatch: adminRateLimitedProcedure("mutation")
    .input(CreateCuratedCourtBatchSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.createCuratedPlacesBatch(ctx.userId, input.items);
    }),

  /**
   * Get any place details
   * Admin only
   */
  getById: adminProcedure
    .input(AdminCourtDetailSchema)
    .query(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.getPlaceById(ctx.userId, input);
    }),

  /**
   * Upload a place photo (admin)
   */
  uploadPhoto: adminRateLimitedProcedure("mutation")
    .input(UploadCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.uploadPhoto(ctx.userId, input);
    }),

  /**
   * Remove a place photo (admin)
   */
  removePhoto: adminProcedure
    .input(RemoveCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      await service.removePhoto(ctx.userId, input);
      return { success: true };
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
   * Delete a place (hard delete)
   * Admin only + rate limited
   */
  deletePlace: adminRateLimitedProcedure("mutation")
    .input(AdminDeletePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      await service.deletePlaceHard(ctx.userId, input.placeId);
      return { success: true };
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
   * Transfer place ownership to an organization
   * Admin only + rate limited
   */
  transfer: adminRateLimitedProcedure("mutation")
    .input(TransferPlaceSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.transferPlaceToOrganization(ctx.userId, input);
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

  /**
   * Get court stats (total + reservable counts) in a single query
   * Admin only
   */
  stats: adminProcedure.query(async () => {
    const service = makeAdminCourtService();
    return service.getStats();
  }),
});
