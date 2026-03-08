"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import CountUp from "react-countup";
import { appRoutes } from "@/common/app-routes";
import { PlaceCard, type PlaceCardPlace } from "@/components/kudos";
import { useQueryHomePlaceStats } from "@/features/home/hooks";

const SHOWCASE_MAIN: PlaceCardPlace = {
  id: "showcase-main",
  slug: null,
  name: "Smash Zone Cebu",
  address: "Banilad, Cebu City",
  city: "Cebu City",
  coverImageUrl: "/images/showcase/pickleball-court.webp",
  sports: [{ id: "s1", name: "Pickleball", slug: "pickleball" }],
  courtCount: 4,
  lowestPriceCents: 20000,
  currency: "PHP",
  placeType: "RESERVABLE",
  verificationStatus: "VERIFIED",
  reservationsEnabled: true,
  averageRating: 4.6,
  reviewCount: 12,
};

const SHOWCASE_SECONDARY: PlaceCardPlace = {
  id: "showcase-secondary",
  slug: null,
  name: "Rally Hub QC",
  address: "Scout Area, Quezon City",
  city: "Quezon City",
  coverImageUrl: "/images/showcase/basketball-court.webp",
  sports: [{ id: "s2", name: "Basketball", slug: "basketball" }],
  courtCount: 6,
  lowestPriceCents: 35000,
  currency: "PHP",
  placeType: "RESERVABLE",
  verificationStatus: "VERIFIED",
  averageRating: 4.3,
  reviewCount: 8,
};

function StatsCountBadge() {
  const { data: stats } = useQueryHomePlaceStats();
  return (
    <>
      <span className="text-xl font-extrabold text-primary tracking-[-0.03em] block">
        <CountUp end={stats?.totalPlaces ?? 0} duration={1.5} separator="," />+
      </span>
      <small className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.04em]">
        Venues
      </small>
    </>
  );
}

export function ShowcaseCards() {
  return (
    <div className="relative h-[520px] hidden lg:block">
      {/* Main card */}
      <Link
        href={appRoutes.courts.base}
        className="absolute w-[290px] top-[10px] left-[10px] z-[3] rotate-[-1.5deg] transition-transform duration-400 hover:-translate-y-1.5 hover:rotate-0 animate-slide-in-right stagger-2 block rounded-xl overflow-hidden"
      >
        <PlaceCard place={SHOWCASE_MAIN} linkScope="none" showPrice showCTA />
      </Link>

      {/* Secondary card */}
      <Link
        href={appRoutes.courts.base}
        className="absolute w-[290px] top-[80px] right-[-10px] z-[2] rotate-[2.5deg] transition-transform duration-400 hover:-translate-y-1.5 hover:rotate-0 animate-slide-in-right stagger-4 block rounded-xl overflow-hidden"
      >
        <PlaceCard
          place={SHOWCASE_SECONDARY}
          linkScope="none"
          showPrice
          showCTA
        />
      </Link>

      {/* Floating badge — player reviews */}
      <div className="absolute bottom-[10px] left-[-16px] z-[5] bg-card rounded-[14px] px-4 py-2.5 shadow-[0_6px_20px_oklch(0_0_0/0.09)] border border-border flex items-center gap-2.5 animate-slide-in-right stagger-5">
        <div className="w-9 h-9 rounded-[10px] bg-success-light flex items-center justify-center">
          <Check className="h-[18px] w-[18px] text-success" />
        </div>
        <div className="font-heading">
          <strong className="text-sm font-extrabold tracking-[-0.02em] block">
            Player reviews
          </strong>
          <small className="text-[11px] text-muted-foreground font-medium">
            From real players
          </small>
        </div>
      </div>

      {/* Floating badge — venue count */}
      <div className="absolute top-[10px] right-[16px] z-[5] bg-card rounded-[14px] px-4 py-2.5 shadow-[0_6px_20px_oklch(0_0_0/0.09)] border border-border text-center font-heading animate-slide-in-right stagger-5">
        <StatsCountBadge />
      </div>
    </div>
  );
}
