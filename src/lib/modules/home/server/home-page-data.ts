import { unstable_cache } from "next/cache";
import { mapPlaceSummary } from "@/features/discovery/helpers";
import { publicCaller } from "@/trpc/server";

export interface HomePublicStats {
  totalPlaces: number;
  totalCourts: number;
  totalCities: number;
}

const getCachedFeaturedPlaces = unstable_cache(
  async () => {
    const featuredInput = {
      featuredOnly: true,
      limit: 3,
      offset: 0,
    };
    const featuredResponse = await publicCaller.place.list(featuredInput);
    return featuredResponse.items.map(mapPlaceSummary);
  },
  ["home-featured"],
  { tags: ["home:featured"] },
);

const getCachedHomePlaceStats = unstable_cache(
  async (): Promise<HomePublicStats> => publicCaller.place.stats(),
  ["home-place-stats"],
  { tags: ["home:stats"] },
);

export const getHomeFeaturedPlaces = async () => getCachedFeaturedPlaces();

export const getHomePlaceStats = async () => getCachedHomePlaceStats();
