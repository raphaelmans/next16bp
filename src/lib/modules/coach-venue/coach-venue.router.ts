import { TRPCError } from "@trpc/server";
import { CoachNotFoundError } from "@/lib/modules/coach/errors/coach.errors";
import { protectedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  CoachVenueIdSchema,
  InviteCoachToVenueSchema,
  ListCoachVenuesByPlaceSchema,
} from "./dtos/coach-venue.dto";
import {
  CoachVenueAlreadyLinkedError,
  CoachVenueInvalidStatusError,
  CoachVenueNotCoachError,
  CoachVenueNotFoundError,
  CoachVenueNotOwnerError,
} from "./errors/coach-venue.errors";
import { makeCoachVenueService } from "./factories/coach-venue.factory";

function handleCoachVenueError(error: unknown): never {
  if (
    error instanceof CoachVenueNotFoundError ||
    error instanceof CoachNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachVenueAlreadyLinkedError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof CoachVenueNotOwnerError ||
    error instanceof CoachVenueNotCoachError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof CoachVenueInvalidStatusError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof AppError) {
    const code =
      error.httpStatus === 422
        ? "UNPROCESSABLE_CONTENT"
        : error.httpStatus === 409
          ? "CONFLICT"
          : "BAD_REQUEST";

    throw new TRPCError({
      code,
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const coachVenueRouter = router({
  // Owner procedures
  invite: protectedProcedure
    .input(InviteCoachToVenueSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.inviteCoach(
          ctx.userId,
          input.coachId,
          input.placeId,
        );
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  remove: protectedProcedure
    .input(CoachVenueIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.removeFromVenue(ctx.userId, input.coachVenueId);
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  listByVenue: protectedProcedure
    .input(ListCoachVenuesByPlaceSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.listByVenue(input.placeId);
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  // Coach procedures
  accept: protectedProcedure
    .input(CoachVenueIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.acceptInvitation(ctx.userId, input.coachVenueId);
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  decline: protectedProcedure
    .input(CoachVenueIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.declineInvitation(ctx.userId, input.coachVenueId);
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  leave: protectedProcedure
    .input(CoachVenueIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeCoachVenueService();
        return await service.leaveVenue(ctx.userId, input.coachVenueId);
      } catch (error) {
        handleCoachVenueError(error);
      }
    }),

  listMyVenues: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = makeCoachVenueService();
      return await service.listMyVenues(ctx.userId);
    } catch (error) {
      handleCoachVenueError(error);
    }
  }),

  listPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const service = makeCoachVenueService();
      return await service.listPendingInvitations(ctx.userId);
    } catch (error) {
      handleCoachVenueError(error);
    }
  }),
});
