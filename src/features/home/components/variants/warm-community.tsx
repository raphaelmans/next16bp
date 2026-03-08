"use client";

import { Calendar, Play, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DiscoveryPublicShell } from "@/features/discovery/components/public-shell";
import type { PlaceSummary } from "@/features/discovery/helpers";
import { HomeSearchForm } from "@/features/home/components/home-search-form";
import { POPULAR_LOCATIONS } from "@/features/home/constants/popular-locations";
import { BeforeAfter } from "./shared/before-after";
import { FaqSection } from "./shared/faq-section";
import { FeaturedVenues } from "./shared/featured-venues";
import { FinalCta } from "./shared/final-cta";
import { OwnerStrip } from "./shared/owner-strip";
import { ProofBar } from "./shared/proof-bar";
import { ShowcaseCards } from "./shared/showcase-cards";

const VARIANT = "warm-community" as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search",
    description:
      "Pick a sport and city. Browse every venue in the area with reviews, photos, and amenities.",
    icon: Search,
  },
  {
    step: 2,
    title: "Check",
    description:
      "Read player reviews, compare pricing, and check availability when venues publish open slots.",
    icon: Calendar,
  },
  {
    step: 3,
    title: "Play",
    description:
      "Walk in, call ahead, or reserve online — whatever the venue offers. Show up and play.",
    icon: Play,
  },
];

interface WarmCommunityPageProps {
  featuredPlaces: PlaceSummary[];
}

export function WarmCommunityPage({ featuredPlaces }: WarmCommunityPageProps) {
  return (
    <DiscoveryPublicShell>
      {/* Hero — soft gradient, rounded, warm */}
      <section className="relative overflow-hidden pt-10 pb-28 sm:pt-[140px] sm:pb-28">
        {/* Soft teal-to-white gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--color-primary) 6%, transparent) 0%, transparent 70%)",
          }}
        />

        <Container>
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-14 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 font-heading text-xs font-semibold text-primary bg-primary/8 border border-primary/12 px-4 py-2 rounded-full mb-6">
                Venue Discovery for Filipino Players
              </div>

              <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
                Where Filipino players
                <span className="block text-primary">
                  discover sports venues.
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground max-w-[440px] mb-8">
                Find venues near you, read what other players think, and check
                amenities and availability — all in one place.
              </p>

              <HomeSearchForm
                popularLocations={POPULAR_LOCATIONS}
                variant="hero"
              />
            </div>

            {/* Right — showcase cards */}
            <ShowcaseCards />
          </div>
        </Container>
      </section>

      {/* Proof Bar — floating card */}
      <ProofBar variant={VARIANT} />

      {/* How It Works — single card with rows */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              Discover a venue in 3 steps
            </h2>
          </div>
          <div className="mx-auto max-w-xl animate-fade-in-up">
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className={`flex items-start gap-5 p-6 ${i < HOW_IT_WORKS.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold tracking-[-0.01em] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Before / After */}
      <BeforeAfter variant={VARIANT} />

      {/* Featured Venues */}
      <FeaturedVenues featuredPlaces={featuredPlaces} variant={VARIANT} />

      {/* FAQ */}
      <FaqSection variant={VARIANT} />

      {/* Final CTA */}
      <FinalCta variant={VARIANT} />

      {/* Owner Strip */}
      <OwnerStrip variant={VARIANT} />
    </DiscoveryPublicShell>
  );
}
