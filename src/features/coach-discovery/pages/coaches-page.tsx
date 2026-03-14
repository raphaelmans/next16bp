import type {
  CoachDiscoveryLocationRouteScope,
  CoachLocationDefaults,
} from "../location-routing";
import { DiscoveryHydratedCoachesPage } from "../server/public-coaches-discovery";

interface DiscoveryCoachesPageProps {
  initialFilters?: CoachLocationDefaults;
  initialLocationLabel?: string;
  locationRoutePath?: string;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
  searchParams?: Record<string, string | string[] | undefined>;
}

export function DiscoveryCoachesPage({
  initialFilters,
  initialLocationLabel,
  locationRoutePath,
  locationRouteScope,
  searchParams,
}: DiscoveryCoachesPageProps) {
  return (
    <DiscoveryHydratedCoachesPage
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
      locationRoutePath={locationRoutePath}
      locationRouteScope={locationRouteScope}
      searchParams={searchParams}
    />
  );
}
