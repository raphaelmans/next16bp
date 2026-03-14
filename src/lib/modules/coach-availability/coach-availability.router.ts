import { TRPCError } from "@trpc/server";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import { rateLimitedProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  GetCoachAvailabilityRangeSchema,
  GetCoachAvailabilitySchema,
} from "./dtos";
import { InvalidCoachAvailabilityAddonSelectionError } from "./errors/coach-availability.errors";
import { makeCoachAvailabilityService } from "./factories/coach-availability.factory";

export function handleCoachAvailabilityError(error: unknown): never {
  const appError = error instanceof AppError ? error : null;
  const errorCode = appError?.code;

  if (
    error instanceof CoachNotFoundError ||
    error instanceof CoachNotActiveError ||
    errorCode === "COACH_NOT_FOUND" ||
    errorCode === "COACH_NOT_ACTIVE"
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: appError?.message ?? "Coach not found",
      cause: error,
    });
  }

  if (
    error instanceof InvalidCoachAvailabilityAddonSelectionError ||
    errorCode === "INVALID_COACH_AVAILABILITY_ADDON_SELECTION"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        appError?.message ??
        "One or more selected add-ons are not valid for this coach availability context.",
      cause: error,
    });
  }

  throw error;
}

export const coachAvailabilityRouter = router({
  getForCoach: rateLimitedProcedure("publicAvailability")
    .input(GetCoachAvailabilitySchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachAvailabilityService();
        return service.getForCoach(input);
      } catch (error) {
        handleCoachAvailabilityError(error);
      }
    }),
  getForCoachRange: rateLimitedProcedure("publicAvailability")
    .input(GetCoachAvailabilityRangeSchema)
    .query(async ({ input }) => {
      try {
        const service = makeCoachAvailabilityService();
        return service.getForCoachRange(input);
      } catch (error) {
        handleCoachAvailabilityError(error);
      }
    }),
});
