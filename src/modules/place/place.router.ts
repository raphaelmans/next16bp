import { publicProcedure, router } from "@/shared/infra/trpc/trpc";
import { GetPlaceByIdSchema, ListPlacesSchema } from "./dtos";
import { makePlaceDiscoveryService } from "./factories/place.factory";

export const placeRouter = router({
  list: publicProcedure.input(ListPlacesSchema).query(async ({ input }) => {
    const service = makePlaceDiscoveryService();
    return service.listPlaces(input);
  }),
  getById: publicProcedure
    .input(GetPlaceByIdSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.getPlaceById(input.placeId);
    }),
});
