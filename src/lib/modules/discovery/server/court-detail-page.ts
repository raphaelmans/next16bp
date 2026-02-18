import { appRoutes } from "@/common/app-routes";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const getPlaceDetailsForCourtRoute = async (placeId: string) => {
  const caller = await createServerCaller(appRoutes.places.detail(placeId));
  return caller.place.getByIdOrSlug({
    placeIdOrSlug: placeId,
  });
};
