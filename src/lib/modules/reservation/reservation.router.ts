import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/lib/modules/profile/errors/profile.errors";
import { makeProfileService } from "@/lib/modules/profile/factories/profile.factory";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  CancelReservationSchema,
  CreateReservationForAnyCourtSchema,
  CreateReservationForCourtSchema,
  CreateReservationGroupSchema,
  GetMyReservationsSchema,
  GetPaymentInfoSchema,
  GetPlayerReservationLinkedDetailSchema,
  MarkPaymentLinkedSchema,
  MarkPaymentSchema,
  PingOwnerSchema,
} from "./dtos";
import {
  InvalidReservationAddonSelectionError,
  InvalidReservationStatusError,
  NoAvailabilityError,
  NotReservationOwnerError,
  PingLimitExceededError,
  ReservationCancellationWindowError,
  ReservationExpiredError,
  ReservationGroupNotFoundError,
  ReservationNotFoundError,
  SlotNotAvailableError,
  TermsNotAcceptedError,
} from "./errors/reservation.errors";
import { makeReservationService } from "./factories/reservation.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleReservationError(error: unknown): never {
  if (
    error instanceof ReservationNotFoundError ||
    error instanceof ReservationGroupNotFoundError ||
    error instanceof ProfileNotFoundError ||
    error instanceof CourtNotFoundError ||
    error instanceof PlaceNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotReservationOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof ReservationExpiredError ||
    error instanceof ReservationCancellationWindowError ||
    error instanceof InvalidReservationStatusError ||
    error instanceof InvalidReservationAddonSelectionError ||
    error instanceof TermsNotAcceptedError ||
    error instanceof SlotNotAvailableError ||
    error instanceof NoAvailabilityError ||
    error instanceof IncompleteProfileError ||
    error instanceof PingLimitExceededError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
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

export const reservationRouter = router({
  createForCourt: protectedRateLimitedProcedure("sensitive")
    .input(CreateReservationForCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.createReservationForCourt(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  createForAnyCourt: protectedRateLimitedProcedure("sensitive")
    .input(CreateReservationForAnyCourtSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.createReservationForAnyCourt(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  createGroup: protectedRateLimitedProcedure("sensitive")
    .input(CreateReservationGroupSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.createReservationGroup(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Mark payment as complete
   */
  markPayment: protectedProcedure
    .input(MarkPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Get profile for the user
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.markPayment(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Mark payment as complete for all payable linked reservations.
   */
  markPaymentLinked: protectedProcedure
    .input(MarkPaymentLinkedSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.markPaymentLinked(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Cancel a reservation
   */
  cancel: protectedProcedure
    .input(CancelReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Get profile for the user
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.cancelReservation(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Ping court owner with a push notification
   */
  pingOwner: protectedRateLimitedProcedure("sensitive")
    .input(PingOwnerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.pingOwner(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get a reservation by ID
   */
  getById: protectedProcedure
    .input(z.object({ reservationId: S.ids.reservationId }))
    .query(async ({ input }) => {
      try {
        const reservationService = makeReservationService();
        return await reservationService.getReservationById(input.reservationId);
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get reservation details with related entities
   */
  getDetail: protectedProcedure
    .input(z.object({ reservationId: S.ids.reservationId }))
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);
        const reservationService = makeReservationService();
        const detail = await reservationService.getReservationDetail(
          input.reservationId,
        );
        if (detail.reservation.playerId !== profile.id) {
          throw new NotReservationOwnerError();
        }
        return detail;
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get linked reservation detail for the current player.
   */
  getLinkedDetail: protectedProcedure
    .input(GetPlayerReservationLinkedDetailSchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);
        const reservationService = makeReservationService();
        return await reservationService.getReservationLinkedDetail(
          ctx.userId,
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get payment info for a reservation (player only)
   */
  getPaymentInfo: protectedProcedure
    .input(GetPaymentInfoSchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);
        const reservationService = makeReservationService();
        return await reservationService.getPaymentInfo(
          ctx.userId,
          profile.id,
          input.reservationId,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get my reservations
   */
  getMy: protectedProcedure
    .input(GetMyReservationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Get profile for the user
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.getMyReservations(profile.id, input);
      } catch (error) {
        handleReservationError(error);
      }
    }),

  /**
   * Get my reservations with details
   */
  getMyWithDetails: protectedProcedure
    .input(GetMyReservationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.getMyReservationsWithDetails(
          profile.id,
          input,
        );
      } catch (error) {
        handleReservationError(error);
      }
    }),
});
