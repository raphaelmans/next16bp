import type { PlaceSummary } from "@/features/discovery/helpers";
import HomePageClient from "@/features/home/components/home-page-client";

interface HomeLandingPageProps {
  featuredPlaces: PlaceSummary[];
}

export function HomeLandingPage({ featuredPlaces }: HomeLandingPageProps) {
  return <HomePageClient featuredPlaces={featuredPlaces} />;
}
