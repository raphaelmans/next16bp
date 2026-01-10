import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  AddAmenitySchema,
  AddPhotoSchema,
  CreateReservableCourtSchema,
  CreateSimpleCourtSchema,
  RemoveAmenitySchema,
  RemovePhotoSchema,
  ReorderPhotosSchema,
  UpdateCourtSchema,
  UpdateReservableCourtDetailSchema,
  UploadCourtPhotoSchema,
} from "./dtos";
import {
  AmenityNotFoundError,
  CourtNotFoundError,
  CourtNotReservableError,
  DuplicateAmenityError,
  MaxPhotosExceededError,
  NotCourtOwnerError,
  PhotoNotFoundError,
} from "./errors/court.errors";
import {
  makeCourtManagementService,
  makeCreateReservableCourtUseCase,
  makeCreateSimpleCourtUseCase,
} from "./factories/court.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleCourtManagementError(error: unknown): never {
  if (
    error instanceof CourtNotFoundError ||
    error instanceof OrganizationNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof NotCourtOwnerError ||
    error instanceof NotOrganizationOwnerError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof DuplicateAmenityError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof MaxPhotosExceededError ||
    error instanceof CourtNotReservableError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof PhotoNotFoundError ||
    error instanceof AmenityNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const courtManagementRouter = router({
  /**
   * Create a new reservable court for an organization (full version)
   */
  createReservable: protectedRateLimitedProcedure("mutation")
    .input(CreateReservableCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const useCase = makeCreateReservableCourtUseCase();
        return await useCase.execute(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Create a court with simplified fields (for onboarding flow)
   * Creates a RESERVABLE court with CLAIMED status
   * Coordinates default to 0,0 and can be updated later
   */
  createCourt: protectedRateLimitedProcedure("mutation")
    .input(CreateSimpleCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const useCase = makeCreateSimpleCourtUseCase();
        return await useCase.execute(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Get all courts owned by the current user
   */
  getMyCourts: protectedProcedure.query(async ({ ctx }) => {
    const service = makeCourtManagementService();
    return await service.getMyCourts(ctx.userId);
  }),

  /**
   * Get a specific court by ID
   */
  getById: protectedProcedure
    .input(z.object({ courtId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const service = makeCourtManagementService();
        return await service.getCourtById(input.courtId);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Update court basic info
   */
  update: protectedProcedure
    .input(UpdateCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.updateCourt(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Update reservable court detail (payment info, etc.)
   */
  updateDetail: protectedProcedure
    .input(UpdateReservableCourtDetailSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.updateReservableCourtDetail(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Deactivate a court
   */
  deactivate: protectedProcedure
    .input(z.object({ courtId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.deactivateCourt(ctx.userId, input.courtId);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Add a photo to a court (URL-based)
   */
  addPhoto: protectedRateLimitedProcedure("mutation")
    .input(AddPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.addPhoto(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Upload a photo to a court (FormData with file)
   */
  uploadPhoto: protectedRateLimitedProcedure("mutation")
    .input(UploadCourtPhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.uploadPhoto(
          ctx.userId,
          input.courtId,
          input.image,
        );
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Remove a photo from a court
   */
  removePhoto: protectedProcedure
    .input(RemovePhotoSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        await service.removePhoto(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Reorder photos
   */
  reorderPhotos: protectedProcedure
    .input(ReorderPhotosSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        await service.reorderPhotos(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Add an amenity to a court
   */
  addAmenity: protectedRateLimitedProcedure("mutation")
    .input(AddAmenitySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        return await service.addAmenity(ctx.userId, input);
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),

  /**
   * Remove an amenity from a court
   */
  removeAmenity: protectedProcedure
    .input(RemoveAmenitySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCourtManagementService();
        await service.removeAmenity(ctx.userId, input);
        return { success: true };
      } catch (error) {
        handleCourtManagementError(error);
      }
    }),
});
