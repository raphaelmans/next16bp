import { TRPCError } from "@trpc/server";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/lib/modules/court/errors/court.errors";
import {
  CourtBlockNotActiveError,
  CourtBlockNotFoundError,
  CourtBlockNotWalkInError,
  CourtBlockOverlapError,
  CourtBlockOverlapsReservationError,
} from "@/lib/modules/court-block/errors/court-block.errors";
import { GuestProfileNotFoundError } from "@/lib/modules/guest-profile/errors/guest-profile.errors";
import { NotOrganizationOwnerError } from "@/lib/modules/organization/errors/organization.errors";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  AcceptReservationSchema,
  ConfirmPaidOfflineSchema,
  ConfirmPaymentSchema,
  ConvertWalkInBlockSchema,
  CreateGuestBookingSchema,
  GetActiveForCourtRangeSchema,
  GetOrgReservationsSchema,
  GetPendingCountSchema,
  GetPendingForCourtSchema,
  RejectReservationSchema,
} from "./dtos";
import {
  InvalidReservationStatusError,
  ReservationDurationInvalidError,
  ReservationExpiredError,
  ReservationNotFoundError,
  ReservationPricingUnavailableError,
  ReservationTimeRangeInvalidError,
} from "./errors/reservation.errors";
import { makeReservationOwnerService } from "./factories/reservation.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleReservationOwnerError(error: unknown): never {
  if (
    error instanceof ReservationNotFoundError ||
    error instanceof CourtNotFoundError ||
    error instanceof PlaceNotFoundError ||
    error instanceof GuestProfileNotFoundError ||
    error instanceof CourtBlockNotFoundError
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
  if (
    error instanceof CourtBlockOverlapsReservationError ||
    error instanceof CourtBlockOverlapError
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof InvalidReservationStatusError ||
    error instanceof ReservationExpiredError ||
    error instanceof ReservationTimeRangeInvalidError ||
    error instanceof ReservationDurationInvalidError ||
    error instanceof ReservationPricingUnavailableError ||
    error instanceof CourtBlockNotActiveError ||
    error instanceof CourtBlockNotWalkInError
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

export const reservationOwnerRouter = router({
  /**
   * Accept a reservation (owner only)
   */
  accept: protectedProcedure
    .input(AcceptReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.acceptReservation(ctx.userId, input.reservationId);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Confirm payment for a reservation (owner only)
   */
  confirmPayment: protectedProcedure
    .input(ConfirmPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.confirmPayment(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Confirm a reservation as paid offline (CREATED -> CONFIRMED, owner only)
   */
  confirmPaidOffline: protectedProcedure
    .input(ConfirmPaidOfflineSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.confirmPaidOffline(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Reject a reservation (owner only)
   */
  reject: protectedProcedure
    .input(RejectReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.rejectReservation(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Create a guest booking directly as CONFIRMED (owner only)
   */
  createGuestBooking: protectedProcedure
    .input(CreateGuestBookingSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.createGuestBooking(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Convert a walk-in block into a guest booking (owner only)
   */
  convertWalkInBlockToGuest: protectedProcedure
    .input(ConvertWalkInBlockSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.convertWalkInBlockToGuest(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Get active reservations for a court in a date range (owner only)
   */
  getActiveForCourtRange: protectedProcedure
    .input(GetActiveForCourtRangeSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.getActiveForCourtRange(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Get pending reservations for a court (owner only)
   */
  getPendingForCourt: protectedProcedure
    .input(GetPendingForCourtSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.getPendingForCourt(ctx.userId, input.courtId);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Get reservations for an organization (owner only)
   */
  getForOrganization: protectedProcedure
    .input(GetOrgReservationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.getForOrganization(ctx.userId, input);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),

  /**
   * Get count of inbox reservations for an organization
   */
  getPendingCount: protectedProcedure
    .input(GetPendingCountSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeReservationOwnerService();
        return await service.getPendingCount(ctx.userId, input.organizationId);
      } catch (error) {
        handleReservationOwnerError(error);
      }
    }),
});
