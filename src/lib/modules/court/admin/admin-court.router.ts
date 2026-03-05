import { revalidatePublicPlaceDetailPaths } from "@/lib/shared/infra/cache/revalidate-public-place-detail";
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
  RecuratePlaceSchema,
  RemoveCourtPhotoSchema,
  TransferPlaceSchema,
  UploadCourtPhotoSchema,
} from "../dtos";
import { makeAdminCourtService } from "../factories/court.factory";

function redactPlaceLocale<T extends { country?: string; timeZone?: string }>(
  place: T,
): Omit<T, "country" | "timeZone"> {
  const { country: _country, timeZone: _timeZone, ...rest } = place;
  return rest;
}

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
      const result = await service.getPlaceById(ctx.userId, input);
      return {
        ...result,
        place: redactPlaceLocale(result.place),
      };
    }),

  /**
   * Upload a place photo (admin)
   */
  uploadPhoto: adminRateLimitedProcedure("mutation")
    .input(UploadCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      const photo = await service.uploadPhoto(ctx.userId, input);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return photo;
    }),

  /**
   * Remove a place photo (admin)
   */
  removePhoto: adminProcedure
    .input(RemoveCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      await service.removePhoto(ctx.userId, input);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
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
      const updated = await service.updatePlace(ctx.userId, input);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return updated;
    }),

  /**
   * Delete a place (hard delete)
   * Admin only + rate limited
   */
  deletePlace: adminRateLimitedProcedure("mutation")
    .input(AdminDeletePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      const existing = await service.getPlaceById(ctx.userId, {
        placeId: input.placeId,
      });
      await service.deletePlaceHard(ctx.userId, input.placeId);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
        placeSlug: existing.place.slug,
      });
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
      const result = await service.deactivatePlace(
        ctx.userId,
        input.placeId,
        input.reason,
      );
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return result;
    }),

  /**
   * Activate a place
   * Admin only
   */
  activate: adminProcedure
    .input(ActivateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      const result = await service.activatePlace(ctx.userId, input.placeId);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return result;
    }),

  /**
   * Transfer place ownership to an organization
   * Admin only + rate limited
   */
  transfer: adminRateLimitedProcedure("mutation")
    .input(TransferPlaceSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      const result = await service.transferPlaceToOrganization(
        ctx.userId,
        input,
      );
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return result;
    }),

  /**
   * Return a venue to curated state
   * Admin only + rate limited
   */
  recurate: adminRateLimitedProcedure("mutation")
    .input(RecuratePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      const result = await service.recuratePlace(ctx.userId, input);
      await revalidatePublicPlaceDetailPaths({
        placeId: input.placeId,
      });
      return result;
    }),

  /**
   * List all places with filters (admin view)
   * Admin only
   */
  list: adminProcedure
    .input(AdminCourtFiltersSchema)
    .query(async ({ input }) => {
      const service = makeAdminCourtService();
      const result = await service.listAllPlaces(input);
      return {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          place: redactPlaceLocale(item.place),
        })),
      };
    }),

  /**
   * Get court stats (total + reservable counts) in a single query
   * Admin only
   */
  stats: adminProcedure.query(async () => {
    const service = makeAdminCourtService();
    return service.getStats();
  }),

  /**
   * Get onboarding status for a place (verification + per-court config)
   * Admin only
   */
  getOnboardingStatus: adminProcedure
    .input(AdminCourtDetailSchema)
    .query(async ({ input, ctx }) => {
      const service = makeAdminCourtService();
      return service.getPlaceOnboardingStatus(ctx.userId, input);
    }),
});
