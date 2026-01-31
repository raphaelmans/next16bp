import { TRPCError } from "@trpc/server";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/lib/modules/organization/errors/organization.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  CreatePlaceSchema,
  DeletePlaceSchema,
  GetPlaceByIdSchema,
  ListMyPlacesSchema,
  RemovePlacePhotoSchema,
  ReorderPlacePhotosSchema,
  UpdatePlaceSchema,
  UploadPlacePhotoSchema,
} from "./dtos";
import {
  NotPlaceOwnerError,
  PlaceNotFoundError,
  PlacePhotoNotFoundError,
} from "./errors/place.errors";
import { makePlaceManagementService } from "./factories/place.factory";

function handlePlaceManagementError(error: unknown): never {
  if (
    error instanceof PlaceNotFoundError ||
    error instanceof PlacePhotoNotFoundError ||
    error instanceof OrganizationNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof NotOrganizationOwnerError ||
    error instanceof NotPlaceOwnerError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    const code =
      error.httpStatus === 409
        ? "CONFLICT"
        : error.httpStatus === 422
          ? "UNPROCESSABLE_CONTENT"
          : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const placeManagementRouter = router({
  create: protectedRateLimitedProcedure("mutation")
    .input(CreatePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        return await service.createPlace(ctx.userId, input);
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  update: protectedProcedure
    .input(UpdatePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        return await service.updatePlace(ctx.userId, input);
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  delete: protectedProcedure
    .input(DeletePlaceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        await service.deletePlace(ctx.userId, input.placeId);
        return { success: true };
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  list: protectedProcedure
    .input(ListMyPlacesSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        return await service.listMyPlaces(ctx.userId, input);
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  getById: protectedProcedure
    .input(GetPlaceByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        return await service.getPlaceById(ctx.userId, input.placeId);
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  uploadPhoto: protectedRateLimitedProcedure("mutation")
    .input(UploadPlacePhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        return await service.uploadPhoto(
          ctx.userId,
          input.placeId,
          input.image,
        );
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  removePhoto: protectedProcedure
    .input(RemovePlacePhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        await service.removePhoto(ctx.userId, input.placeId, input.photoId);
        return { success: true };
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
  reorderPhotos: protectedProcedure
    .input(ReorderPlacePhotosSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makePlaceManagementService();
        const photos = await service.reorderPhotos(
          ctx.userId,
          input.placeId,
          input.orderedIds,
        );
        return { photos };
      } catch (error) {
        handlePlaceManagementError(error);
      }
    }),
});
