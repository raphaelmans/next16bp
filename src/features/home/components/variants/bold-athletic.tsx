"use client";

import { Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import type { PlaceSummary } from "@/features/discovery/helpers";
import { DiscoveryPublicShell } from "@/features/discovery/components/public-shell";
import { HomeSearchForm } from "@/features/home/components/home-search-form";
import { POPULAR_LOCATIONS } from "@/features/home/constants/popular-locations";
import { BeforeAfter } from "./shared/before-after";
import { FaqSection } from "./shared/faq-section";
import { FeaturedVenues } from "./shared/featured-venues";
import { FinalCta } from "./shared/final-cta";
import { OwnerStrip } from "./shared/owner-strip";
import { ProofBar } from "./shared/proof-bar";
import { ShowcaseCards } from "./shared/showcase-cards";

const VARIANT = "bold-athletic" as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search",
    description:
      "Pick a sport and city. Browse every court in the area with reviews, photos, and amenities.",
    icon: Search,
  },
  {
    step: 2,
    title: "Check",
    description:
      "Read player reviews, compare pricing, and check availability when venues publish open slots.",
    icon: Search,
  },
  {
    step: 3,
    title: "Play",
    description:
      "Walk in, call ahead, or reserve online — whatever the venue offers. Show up and play.",
    icon: Search,
  },
];

interface BoldAthleticPageProps {
  featuredPlaces: PlaceSummary[];
}

export function BoldAthleticPage({ featuredPlaces }: BoldAthleticPageProps) {
  return (
    <DiscoveryPublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-[140px] sm:pb-20">
        {/* Teal-dominant gradient mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              "radial-gradient(ellipse 70% 50% at 15% 35%, color-mix(in oklch, var(--color-primary) 9%, transparent) 0%, transparent 55%)",
              "radial-gradient(ellipse 50% 70% at 85% 25%, color-mix(in oklch, var(--color-primary) 6%, transparent) 0%, transparent 45%)",
              "radial-gradient(ellipse 60% 40% at 50% 90%, color-mix(in oklch, var(--color-primary) 4%, transparent) 0%, transparent 50%)",
            ].join(", "),
          }}
        />

        <Container>
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-14 items-center">
            {/* Left */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-primary bg-primary/5 border border-primary/12 px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-[0.05em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Sports Court Discovery
              </div>

              <h1 className="font-heading text-5xl md:text-7xl font-extrabold leading-[1.04] tracking-tight mb-5 uppercase">
                Where Filipino
                <span className="block">players discover</span>
                <span className="block text-primary">sports courts.</span>
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground max-w-[430px] mb-8">
                Stop hopping between Facebook pages and reservation sites.
                Search courts, read player reviews, and check availability — all
                in one place.
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

      {/* How It Works */}
      <section className="py-24 bg-white border-b border-border">
        <Container>
          <div className="text-center mb-14">
            <p className="font-mono text-[11px] font-medium text-primary uppercase tracking-[0.1em] mb-2.5">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-[-0.03em]">
              Discover a court in 3 steps
            </h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
            {/* Connecting dashed line (desktop only) */}
            <div className="hidden md:block absolute top-9 left-[17%] right-[17%] h-0.5 bg-[repeating-linear-gradient(90deg,var(--border)_0,var(--border)_8px,transparent_8px,transparent_16px)]" />
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className={`text-center relative animate-fade-in-up stagger-${i + 1}`}
              >
                {/* Watermark step number */}
                <div className="absolute inset-x-0 -top-2 text-6xl font-extrabold text-teal-100 font-heading select-none pointer-events-none">
                  0{step.step}
                </div>
                <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5 font-heading text-[28px] font-extrabold relative z-10 bg-primary/10 text-primary">
                  {step.step}
                </div>
                <h3 className="font-heading text-lg font-bold tracking-[-0.01em] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
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
