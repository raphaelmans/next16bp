import { cache } from "react";
import { appRoutes } from "@/common/app-routes";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const getPlaceDetailsByIdOrSlug = cache(
  async (placeIdOrSlug: string) => {
    const caller = await createServerCaller(
      appRoutes.places.detail(placeIdOrSlug),
    );
    return caller.place.getByIdOrSlug({ placeIdOrSlug });
  },
);
