import { DiscoveryHydratedCourtsPage } from "@/features/discovery/server/public-courts-discovery";

type LocationDefaults = {
  province?: string;
  city?: string;
  sportId?: string;
};

interface DiscoveryCourtsPageProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function DiscoveryCourtsPage({
  initialFilters,
  initialLocationLabel,
  searchParams,
}: DiscoveryCourtsPageProps) {
  return (
    <DiscoveryHydratedCourtsPage
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
      searchParams={searchParams ? await searchParams : undefined}
    />
  );
}
