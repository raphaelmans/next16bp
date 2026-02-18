import CourtsPageClient from "@/features/discovery/components/courts-page-client";

type LocationDefaults = {
  province?: string;
  city?: string;
};

interface DiscoveryCourtsPageProps {
  initialFilters?: LocationDefaults;
  initialLocationLabel?: string;
}

export function DiscoveryCourtsPage({
  initialFilters,
  initialLocationLabel,
}: DiscoveryCourtsPageProps) {
  return (
    <CourtsPageClient
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
    />
  );
}
