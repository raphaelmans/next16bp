import { TRPCError } from "@trpc/server";
import { CourtNotFoundError } from "@/modules/court/errors/court.errors";
import { PlaceNotFoundError } from "@/modules/place/errors/place.errors";
import { publicProcedure, router } from "@/shared/infra/trpc/trpc";
import {
  GetAvailabilityForCourtSchema,
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
        return await service.getForCourt(input);
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
  getForPlaceSport: publicProcedure
    .input(GetAvailabilityForPlaceSportSchema)
    .query(async ({ input }) => {
      try {
        const service = makeAvailabilityService();
        return await service.getForPlaceSport(input);
      } catch (error) {
        handleAvailabilityError(error);
      }
    }),
});
