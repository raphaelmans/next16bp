import { unstable_cache } from "next/cache";
import { mapPlaceSummary } from "@/features/discovery/helpers";
import { publicCaller, trpc } from "@/trpc/server";

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

export const getHomeFeaturedPlaces = async () => getCachedFeaturedPlaces();

export const prefetchHomeData = async () => {
  await trpc.place.stats.prefetch();
};
