import type { MetadataRoute } from "next";
import { getSitemapBuckets } from "@/lib/shared/lib/sitemap-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const buckets = await getSitemapBuckets();

  return [
    ...buckets.static,
    ...buckets.editorial,
    ...buckets.locations,
    ...buckets.venues,
    ...buckets.organizations,
  ];
}
