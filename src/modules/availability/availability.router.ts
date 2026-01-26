import { TRPCError } from "@trpc/server";
import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import { publicProcedure, router } from "@/shared/infra/trpc/trpc";
import {
  GetAvailabilityForCourtRangeSchema,
  GetAvailabilityForCourtSchema,
  GetAvailabilityForCourtsSchema,
  GetAvailabilityForPlaceSportRangeSchema,
  GetAvailabilityForPlaceSportSchema,
} from "./dtos";
import { makeAvailabilityService } from "./factories/availability.factory";

function handleAvailabilityError(error: unknown): never {
  if (
    error instanceof CourtNotFoundError ||
    error instanceof PlaceNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  throw error;
}

export const availabilityRouter = router({
  getForCourt: publicProcedure
    .input(GetAvailabilityForCourtSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        const result = await service.getForCourt(input);
        return { options: result.options, diagnostics: result.diagnostics };
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
  getForCourts: publicProcedure
    .input(GetAvailabilityForCourtsSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        const result = await service.getForCourts(input);
        return { options: result.options, diagnostics: result.diagnostics };
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
  getForPlaceSport: publicProcedure
    .input(GetAvailabilityForPlaceSportSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        const result = await service.getForPlaceSport(input);
        return { options: result.options, diagnostics: result.diagnostics };
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
  getForCourtRange: publicProcedure
    .input(GetAvailabilityForCourtRangeSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        const result = await service.getForCourtRange(input);
        return { options: result.options, diagnostics: result.diagnostics };
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
  getForPlaceSportRange: publicProcedure
    .input(GetAvailabilityForPlaceSportRangeSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        const result = await service.getForPlaceSportRange(input);
        return { options: result.options, diagnostics: result.diagnostics };
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
});
