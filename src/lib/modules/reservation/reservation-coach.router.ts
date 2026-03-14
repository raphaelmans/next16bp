import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S } from "@/common/schemas";
import { CoachNotFoundError } from "@/lib/modules/coach/errors/coach.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  AcceptCoachReservationSchema,
  CancelCoachReservationSchema,
  ConfirmCoachPaymentSchema,
  GetCoachReservationsSchema,
  RejectCoachReservationSchema,
} from "./dtos/reservation-coach.dto";
import {
  InvalidReservationStatusError,
  ReservationExpiredError,
  ReservationNotFoundError,
} from "./errors/reservation.errors";
import { makeCoachReservationService } from "./factories/reservation.factory";

function handleCoachReservationError(error: unknown): never {
  if (
    error instanceof ReservationNotFoundError ||
    error instanceof CoachNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
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

export const reservationCoachRouter = router({
  /**
   * Coach accepts a reservation (CREATED -> AWAITING_PAYMENT).
   */
  accept: protectedRateLimitedProcedure("sensitive")
    .input(AcceptCoachReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.acceptReservation(ctx.userId, input.reservationId);
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Coach rejects a reservation (CREATED -> CANCELLED).
   */
  reject: protectedRateLimitedProcedure("sensitive")
    .input(RejectCoachReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.rejectReservation(ctx.userId, input);
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Coach confirms payment (PAYMENT_MARKED_BY_USER -> CONFIRMED).
   */
  confirmPayment: protectedRateLimitedProcedure("sensitive")
    .input(ConfirmCoachPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.confirmPayment(ctx.userId, input);
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Coach cancels a reservation.
   */
  cancel: protectedRateLimitedProcedure("sensitive")
    .input(CancelCoachReservationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.cancelReservation(ctx.userId, input);
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Get coach's reservations with filters.
   */
  getForCoach: protectedProcedure
    .input(GetCoachReservationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.getForCoach(ctx.userId, input);
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Get a reservation's detail (coach view).
   */
  getDetail: protectedProcedure
    .input(z.object({ reservationId: S.ids.reservationId }))
    .query(async ({ input, ctx }) => {
      try {
        const service = makeCoachReservationService();
        return await service.getReservationDetail(
          ctx.userId,
          input.reservationId,
        );
      } catch (error) {
        handleCoachReservationError(error);
      }
    }),

  /**
   * Get count of pending reservations for the coach.
   */
  getPendingCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = makeCoachReservationService();
      return await service.getPendingCount(ctx.userId);
    } catch (error) {
      handleCoachReservationError(error);
    }
  }),
});
