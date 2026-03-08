"use client";

import type { PlaceSummary } from "@/features/discovery/helpers";
import { LANDING_VARIANT } from "@/features/home/constants/landing-variant";
import { BoldAthleticPage } from "./variants/bold-athletic";
import { CleanMinimalPage } from "./variants/clean-minimal";
import { WarmCommunityPage } from "./variants/warm-community";

const variants = {
  "bold-athletic": BoldAthleticPage,
  "clean-minimal": CleanMinimalPage,
  "warm-community": WarmCommunityPage,
} as const;

interface HomePageClientProps {
  featuredPlaces: PlaceSummary[];
}

export default function HomePageClient({
  featuredPlaces,
}: HomePageClientProps) {
  const Page = variants[LANDING_VARIANT];
  return <Page featuredPlaces={featuredPlaces} />;
}
