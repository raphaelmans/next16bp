import { TRPCError } from "@trpc/server";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import {
  CreatePlaceSchema,
  GetPlaceByIdSchema,
  ListMyPlacesSchema,
  UpdatePlaceSchema,
} from "./dtos";
import { NotPlaceOwnerError, PlaceNotFoundError } from "./errors/place.errors";
import { makePlaceManagementService } from "./factories/place.factory";

function handlePlaceManagementError(error: unknown): never {
  if (
    error instanceof PlaceNotFoundError ||
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
});
