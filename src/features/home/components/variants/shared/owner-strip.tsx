"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import type { LandingVariant } from "@/features/home/constants/landing-variant";

interface OwnerStripProps {
  variant: LandingVariant;
}

function BoldAthleticOwnerStrip() {
  return (
    <section className="bg-[oklch(0.25_0.03_175)] py-10">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-xl font-bold text-white tracking-[-0.02em]">
              Own a sports venue?
            </h3>
            <p className="text-sm text-white/70 mt-1">
              Get found by players searching in your city. Free listing, full
              control.
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="rounded-lg font-heading font-semibold"
          >
            <Link href={appRoutes.listYourVenue.base}>
              List Your Venue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function CleanMinimalOwnerStrip() {
  return (
    <section className="border-t border-gray-100 py-10">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-lg font-bold tracking-[-0.02em]">
              Own a sports venue?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get found by players searching in your city. Free listing, full
              control.
            </p>
          </div>
          <Button asChild className="rounded-xl font-heading font-semibold">
            <Link href={appRoutes.listYourVenue.base}>
              List Your Venue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function WarmCommunityOwnerStrip() {
  return (
    <section className="py-10">
      <Container>
        <div className="rounded-2xl bg-teal-50 border border-border p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold tracking-[-0.02em]">
                Own a sports venue?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get found by players searching in your city. Free listing, full
                control.
              </p>
            </div>
            <Button asChild className="rounded-xl font-heading font-semibold">
              <Link href={appRoutes.listYourVenue.base}>
                List Your Venue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function OwnerStrip({ variant }: OwnerStripProps) {
  switch (variant) {
    case "bold-athletic":
      return <BoldAthleticOwnerStrip />;
    case "clean-minimal":
      return <CleanMinimalOwnerStrip />;
    case "warm-community":
      return <WarmCommunityOwnerStrip />;
  }
}
