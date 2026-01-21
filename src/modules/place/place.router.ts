import { publicProcedure, router } from "@/shared/infra/trpc/trpc";
import {
  GetPlaceByIdOrSlugSchema,
  GetPlaceByIdSchema,
  ListPlaceCardMediaSchema,
  ListPlaceCardMetaSchema,
  ListPlacesSchema,
} from "./dtos";
import { makePlaceDiscoveryService } from "./factories/place.factory";

export const placeRouter = router({
  list: publicProcedure.input(ListPlacesSchema).query(async ({ input }) => {
    const service = makePlaceDiscoveryService();
    return service.listPlaces(input);
  }),
  listSummary: publicProcedure
    .input(ListPlacesSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.listPlaceSummaries(input);
    }),
  cardMediaByIds: publicProcedure
    .input(ListPlaceCardMediaSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.listPlaceCardMediaByIds(input.placeIds);
    }),
  cardMetaByIds: publicProcedure
    .input(ListPlaceCardMetaSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.listPlaceCardMetaByIds(input.placeIds, input.sportId);
    }),
  getById: publicProcedure
    .input(GetPlaceByIdSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.getPlaceById(input.placeId);
    }),
  getByIdOrSlug: publicProcedure
    .input(GetPlaceByIdOrSlugSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      return service.getPlaceByIdOrSlug(input.placeIdOrSlug);
    }),
});
