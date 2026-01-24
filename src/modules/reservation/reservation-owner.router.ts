import { TRPCError } from "@trpc/server";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import { protectedProcedure, router } from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  AcceptReservationSchema,
  ConfirmPaymentSchema,
  GetOrgReservationsSchema,
  GetPendingCountSchema,
  GetPendingForCourtSchema,
  RejectReservationSchema,
} from "./dtos";
import {
  InvalidReservationStatusError,
  ReservationExpiredError,
  ReservationNotFoundError,
} from "./errors/reservation.errors";
import { makeReservationOwnerService } from "./factories/reservation.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleReservationOwnerError(error: unknown): never {
  if (
    error instanceof ReservationNotFoundError ||
    error instanceof CourtNotFoundError
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
    error instanceof InvalidReservationStatusError ||
    error instanceof ReservationExpiredError
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
   * Get count of pending reservations (PAYMENT_MARKED_BY_USER) for an organization
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
