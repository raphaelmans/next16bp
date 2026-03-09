import type {
  DiscoveryLocationDefaults,
  DiscoveryLocationRouteScope,
} from "@/features/discovery/location-routing";
import { DiscoveryHydratedCourtsPage } from "@/features/discovery/server/public-courts-discovery";

interface DiscoveryCourtsPageProps {
  initialFilters?: DiscoveryLocationDefaults;
  initialLocationLabel?: string;
  locationRoutePath?: string;
  locationRouteScope?: DiscoveryLocationRouteScope;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function DiscoveryCourtsPage({
  initialFilters,
  initialLocationLabel,
  locationRoutePath,
  locationRouteScope = "none",
  searchParams,
}: DiscoveryCourtsPageProps) {
  return (
    <DiscoveryHydratedCourtsPage
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
      locationRoutePath={locationRoutePath}
      locationRouteScope={locationRouteScope}
      searchParams={searchParams ? await searchParams : undefined}
    />
  );
}
