import { Container } from "@/components/layout/container";
import type { LandingVariant } from "@/features/home/constants/landing-variant";
import type { HomePublicStats } from "@/lib/modules/home/server/home-page-data";

interface ProofBarProps {
  variant: LandingVariant;
  stats: HomePublicStats;
}

const numberFormatter = new Intl.NumberFormat("en-US");

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
        {numberFormatter.format(value)}+
      </div>
      <div className="text-xs font-heading font-medium mt-0.5">{label}</div>
    </div>
  );
}

function BoldAthleticProofBar({ stats }: { stats: HomePublicStats }) {
  return (
    <div className="bg-[oklch(0.25_0.03_175)] py-8">
      <Container>
        <div className="flex justify-center gap-14 flex-wrap">
          <StatItem
            value={stats.totalPlaces}
            label="Listings"
            className="text-center text-white"
          />
          <StatItem
            value={stats.totalCourts}
            label="Courts"
            className="text-center text-white"
          />
          <StatItem
            value={stats.totalCities}
            label="Cities"
            className="text-center text-white"
          />
        </div>
      </Container>
    </div>
  );
}

function CleanMinimalProofBar({ stats }: { stats: HomePublicStats }) {
  return (
    <div className="border-y border-border py-5">
      <Container>
        <p className="text-sm text-muted-foreground text-center">
          {numberFormatter.format(stats.totalPlaces)} listings{" · "}
          {numberFormatter.format(stats.totalCourts)} courts{" · "}
          {numberFormatter.format(stats.totalCities)} cities
        </p>
      </Container>
    </div>
  );
}

function WarmCommunityProofBar({ stats }: { stats: HomePublicStats }) {
  return (
    <div className="relative z-10 -mt-8 pb-4">
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl bg-white border border-border p-6 shadow-lg">
          <div className="flex justify-center gap-10 flex-wrap">
            <StatItem
              value={stats.totalPlaces}
              label="Listings"
              className="text-center"
            />
            <StatItem
              value={stats.totalCourts}
              label="Courts"
              className="text-center"
            />
            <StatItem
              value={stats.totalCities}
              label="Cities"
              className="text-center"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ProofBar({ variant, stats }: ProofBarProps) {
  switch (variant) {
    case "bold-athletic":
      return <BoldAthleticProofBar stats={stats} />;
    case "clean-minimal":
      return <CleanMinimalProofBar stats={stats} />;
    case "warm-community":
      return <WarmCommunityProofBar stats={stats} />;
  }
}
