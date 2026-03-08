import type { PlaceSummary } from "@/features/discovery/helpers";
import { BoldAthleticPage } from "@/features/home/components/variants/bold-athletic";
import { CleanMinimalPage } from "@/features/home/components/variants/clean-minimal";
import { WarmCommunityPage } from "@/features/home/components/variants/warm-community";
import { LANDING_VARIANT } from "@/features/home/constants/landing-variant";
import type { HomePublicStats } from "@/lib/modules/home/server/home-page-data";

const variants = {
  "bold-athletic": BoldAthleticPage,
  "clean-minimal": CleanMinimalPage,
  "warm-community": WarmCommunityPage,
} as const;

interface HomeLandingPageProps {
  featuredPlaces: PlaceSummary[];
  placeStats: HomePublicStats;
}

export function HomeLandingPage({
  featuredPlaces,
  placeStats,
}: HomeLandingPageProps) {
  const Page = variants[LANDING_VARIANT];
  return <Page featuredPlaces={featuredPlaces} placeStats={placeStats} />;
}
