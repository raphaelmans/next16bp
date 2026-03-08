"use client";

import { ArrowRight } from "lucide-react";
import { appRoutes } from "@/common/app-routes";
import { PlaceCard } from "@/components/kudos";
import { Container } from "@/components/layout/container";
import type { PlaceSummary } from "@/features/discovery/helpers";
import { HomeTrackedLink } from "@/features/home/components/home-tracked-link";
import type { LandingVariant } from "@/features/home/constants/landing-variant";

interface FeaturedVenuesProps {
  featuredPlaces: PlaceSummary[];
  variant: LandingVariant;
}

const sectionStyles: Record<LandingVariant, string> = {
  "bold-athletic": "py-24 bg-white border-t border-border",
  "clean-minimal": "py-20 md:py-32",
  "warm-community": "py-24 bg-white",
};

export function FeaturedVenues({
  featuredPlaces,
  variant,
}: FeaturedVenuesProps) {
  if (featuredPlaces.length === 0) return null;

  return (
    <section className={sectionStyles[variant]}>
      <Container>
        <div className="flex justify-between items-end mb-10">
          <h2 className="font-heading text-[30px] font-extrabold tracking-[-0.03em]">
            Featured Venues
          </h2>
          <HomeTrackedLink
            href={appRoutes.courts.base}
            className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-primary transition-[gap] hover:gap-2.5"
            event="funnel.landing_search_submitted"
          >
            Browse all
            <ArrowRight className="h-4 w-4" />
          </HomeTrackedLink>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </Container>
    </section>
  );
}
