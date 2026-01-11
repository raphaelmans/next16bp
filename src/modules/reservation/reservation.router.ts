import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  IncompleteProfileError,
  ProfileNotFoundError,
} from "@/modules/profile/errors/profile.errors";
import { makeProfileService } from "@/modules/profile/factories/profile.factory";
import { SlotNotFoundError } from "@/modules/time-slot/errors/time-slot.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  CancelReservationSchema,
  CreateReservationSchema,
  GetMyReservationsSchema,
  MarkPaymentSchema,
} from "./dtos";
import {
  InvalidReservationStatusError,
  NotReservationOwnerError,
  ReservationCancellationWindowError,
  ReservationExpiredError,
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
    error instanceof SlotNotFoundError ||
    error instanceof ProfileNotFoundError
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
    error instanceof TermsNotAcceptedError ||
    error instanceof SlotNotAvailableError ||
    error instanceof IncompleteProfileError
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
  /**
   * Create a new reservation (sensitive - rate limited)
   */
  create: protectedRateLimitedProcedure("sensitive")
    .input(CreateReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Get or create profile for the user
        const profileService = makeProfileService();
        const profile = await profileService.getOrCreateProfile(ctx.userId);

        const reservationService = makeReservationService();
        return await reservationService.createReservation(
          ctx.userId,
          profile.id,
          input.timeSlotId,
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
   * Get a reservation by ID
   */
  getById: protectedProcedure
    .input(z.object({ reservationId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const reservationService = makeReservationService();
        return await reservationService.getReservationById(input.reservationId);
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
});
