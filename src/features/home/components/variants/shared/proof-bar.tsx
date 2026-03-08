"use client";

import CountUp from "react-countup";
import { Container } from "@/components/layout/container";
import type { LandingVariant } from "@/features/home/constants/landing-variant";
import { useQueryHomePlaceStats } from "@/features/home/hooks";

interface ProofBarProps {
  variant: LandingVariant;
}

function StatItem({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-heading text-[26px] font-extrabold tracking-tight">
        <CountUp end={value} duration={1.5} separator="," />+
      </div>
      <div className="text-xs font-heading font-medium mt-0.5">{label}</div>
    </div>
  );
}

function BoldAthleticProofBar({
  stats,
}: {
  stats: ReturnType<typeof useQueryHomePlaceStats>["data"];
}) {
  return (
    <div className="bg-[oklch(0.25_0.03_175)] py-8">
      <Container>
        <div className="flex justify-center gap-14 flex-wrap">
          <StatItem
            value={stats?.totalPlaces ?? 0}
            label="Venues"
            className="text-center text-white"
          />
          <StatItem
            value={stats?.totalCourts ?? 0}
            label="Venues"
            className="text-center text-white"
          />
          <StatItem
            value={stats?.totalCities ?? 0}
            label="Cities"
            className="text-center text-white"
          />
        </div>
      </Container>
    </div>
  );
}

function CleanMinimalProofBar({
  stats,
}: {
  stats: ReturnType<typeof useQueryHomePlaceStats>["data"];
}) {
  return (
    <div className="border-y border-gray-100 py-5">
      <Container>
        <p className="text-sm text-muted-foreground text-center">
          <CountUp end={stats?.totalPlaces ?? 0} duration={1.5} separator="," />{" "}
          venues{" · "}
          <CountUp end={stats?.totalCourts ?? 0} duration={1.5} separator="," />{" "}
          venues{" · "}
          <CountUp end={stats?.totalCities ?? 0} duration={1.5} separator="," />{" "}
          cities
        </p>
      </Container>
    </div>
  );
}

function WarmCommunityProofBar({
  stats,
}: {
  stats: ReturnType<typeof useQueryHomePlaceStats>["data"];
}) {
  return (
    <div className="relative z-10 -mt-8 pb-4">
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl bg-white border border-border p-6 shadow-lg">
          <div className="flex justify-center gap-10 flex-wrap">
            <StatItem
              value={stats?.totalPlaces ?? 0}
              label="Venues"
              className="text-center"
            />
            <StatItem
              value={stats?.totalCourts ?? 0}
              label="Venues"
              className="text-center"
            />
            <StatItem
              value={stats?.totalCities ?? 0}
              label="Cities"
              className="text-center"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ProofBar({ variant }: ProofBarProps) {
  const { data: stats } = useQueryHomePlaceStats();

  switch (variant) {
    case "bold-athletic":
      return <BoldAthleticProofBar stats={stats} />;
    case "clean-minimal":
      return <CleanMinimalProofBar stats={stats} />;
    case "warm-community":
      return <WarmCommunityProofBar stats={stats} />;
  }
}
