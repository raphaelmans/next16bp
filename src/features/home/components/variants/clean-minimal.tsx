"use client";

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

const VARIANT = "clean-minimal" as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search",
    description:
      "Pick a sport and city. Browse court listings in the area with reviews, photos, and amenities.",
  },
  {
    step: 2,
    title: "Check",
    description:
      "Read player reviews, compare pricing, and check availability when courts publish open slots.",
  },
  {
    step: 3,
    title: "Play",
    description:
      "Walk in, call ahead, or reserve online when it is available. Show up and play.",
  },
];

interface CleanMinimalPageProps {
  featuredPlaces: PlaceSummary[];
}

export function CleanMinimalPage({ featuredPlaces }: CleanMinimalPageProps) {
  return (
    <DiscoveryPublicShell>
      {/* Hero — generous whitespace, no badge, no gradient */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-[160px] sm:pb-28">
        {/* Subtle radial glow behind showcase only */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 40% 60% at 80% 40%, color-mix(in oklch, var(--color-primary) 4%, transparent) 0%, transparent 60%)",
          }}
        />

        <Container>
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-14 items-center">
            {/* Left */}
            <div className="animate-in fade-in duration-500">
              <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
                Where Filipino players
                <span className="block">discover sports courts.</span>
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground max-w-[460px] mb-10">
                Stop hopping between Facebook pages and reservation sites.
                Search courts, read player reviews, check amenities and
                availability — all in one place.
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

      {/* Proof Bar */}
      <ProofBar variant={VARIANT} />

      {/* How It Works — connected line, no cards */}
      <section className="py-20 md:py-32">
        <Container>
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              Discover a court in 3 steps
            </h2>
          </div>
          <div className="relative max-w-[900px] mx-auto">
            {/* Horizontal connecting line (desktop) */}
            <div className="hidden md:block absolute top-6 left-[17%] right-[17%] h-px bg-primary/20" />
            {/* Vertical connecting line (mobile) */}
            <div className="md:hidden absolute top-0 bottom-0 left-6 w-px bg-primary/20" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.step}
                  className="relative pl-16 md:pl-0 md:text-center"
                >
                  {/* Step dot */}
                  <div className="absolute left-0 top-0 md:static md:mx-auto w-12 h-12 rounded-full border-2 border-primary/20 bg-white flex items-center justify-center font-heading text-lg font-bold text-primary mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-heading text-base font-bold tracking-[-0.01em] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] md:mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
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
