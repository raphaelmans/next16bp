import { publicProcedure, router } from "@/lib/shared/infra/trpc/trpc";
import { redactPlaceEnhancementFields } from "@/lib/shared/utils/redact-place-fields";
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
    const result = await service.listPlaces(input);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        place: redactPlaceEnhancementFields(item.place),
      })),
    };
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
      const result = await service.getPlaceById(input.placeId);
      return {
        ...result,
        place: redactPlaceEnhancementFields(result.place),
      };
    }),
  getByIdOrSlug: publicProcedure
    .input(GetPlaceByIdOrSlugSchema)
    .query(async ({ input }) => {
      const service = makePlaceDiscoveryService();
      const result = await service.getPlaceByIdOrSlug(input.placeIdOrSlug);
      return {
        ...result,
        place: redactPlaceEnhancementFields(result.place),
      };
    }),
  stats: publicProcedure.query(async () => {
    const service = makePlaceDiscoveryService();
    return service.getPublicStats();
  }),
});
