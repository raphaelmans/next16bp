"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { URLQueryBuilder } from "@/common/url-query-builder";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import type { LandingVariant } from "@/features/home/constants/landing-variant";

interface FinalCtaProps {
  variant: LandingVariant;
}

const COURT_LINE_PATTERN = [
  "repeating-linear-gradient(0deg, transparent, transparent 58px, oklch(1 0 0 / 0.04) 58px, oklch(1 0 0 / 0.04) 60px)",
  "repeating-linear-gradient(90deg, transparent, transparent 58px, oklch(1 0 0 / 0.04) 58px, oklch(1 0 0 / 0.04) 60px)",
].join(", ");

function CtaSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    trackEvent({
      event: "funnel.landing_search_submitted",
      properties: { query: q || undefined },
    });
    if (q) {
      const search = new URLQueryBuilder().addParams({ q }).build();
      router.push(`${appRoutes.courts.base}?${search}`);
    } else {
      router.push(appRoutes.courts.base);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center bg-card rounded-[14px] p-[5px] pl-[18px] shadow-lg min-w-0 sm:min-w-[380px] transition-shadow focus-within:shadow-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courts near you..."
          className="flex-1 border-none outline-none text-[15px] text-foreground bg-transparent placeholder:text-muted-foreground/60 min-w-0"
        />
        <Button
          type="submit"
          className="rounded-[10px] px-[22px] py-[11px] font-heading font-semibold text-sm"
        >
          Search
        </Button>
      </div>
    </form>
  );
}

function BoldAthleticCta() {
  return (
    <section className="relative py-20 bg-primary overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: COURT_LINE_PATTERN }}
      />
      <Container>
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-10">
          <div className="text-center sm:text-left">
            <h2 className="font-heading text-4xl font-extrabold text-primary-foreground tracking-[-0.03em] mb-2">
              Ready to find your next court?
            </h2>
            <p className="text-base text-primary-foreground/70 max-w-[380px]">
              Discover courts near you and start playing today.
            </p>
          </div>
          <CtaSearchForm />
        </div>
      </Container>
    </section>
  );
}

function CleanMinimalCta() {
  return (
    <section className="relative py-20 md:py-32 bg-primary overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: COURT_LINE_PATTERN }}
      />
      <Container>
        <div className="relative flex flex-col items-center text-center gap-8">
          <div>
            <h2 className="font-heading text-4xl font-bold text-primary-foreground tracking-[-0.03em] mb-2">
              Ready to find your next court?
            </h2>
            <p className="text-base text-primary-foreground/70 max-w-[400px] mx-auto">
              Discover courts near you and start playing today.
            </p>
          </div>
          <CtaSearchForm />
        </div>
      </Container>
    </section>
  );
}

function WarmCommunityCta() {
  return (
    <section className="py-20">
      <Container>
        <div className="relative rounded-3xl bg-primary overflow-hidden px-8 py-16 md:px-16">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: COURT_LINE_PATTERN }}
          />
          <div className="relative flex flex-col items-center text-center gap-8">
            <div>
              <h2 className="font-heading text-4xl font-bold text-primary-foreground tracking-[-0.03em] mb-2">
                Ready to find your next court?
              </h2>
              <p className="text-base text-primary-foreground/70 max-w-[400px] mx-auto">
                Discover courts near you and start playing today.
              </p>
            </div>
            <CtaSearchForm />
          </div>
        </div>
      </Container>
    </section>
  );
}

export function FinalCta({ variant }: FinalCtaProps) {
  switch (variant) {
    case "bold-athletic":
      return <BoldAthleticCta />;
    case "clean-minimal":
      return <CleanMinimalCta />;
    case "warm-community":
      return <WarmCommunityCta />;
  }
}
