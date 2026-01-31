import { ArrowRight, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { HomeSearchForm } from "@/app/home-search-form";
import { HomeTrackedLink } from "@/app/home-tracked-link";
import { appRoutes } from "@/common/app-routes";
import { PlaceCard } from "@/components/kudos";
import { Container } from "@/components/layout/container";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import type { PlaceSummary } from "@/features/discovery/helpers";

// Popular locations for quick access
const POPULAR_LOCATIONS = [
  {
    label: "Manila",
    provinceSlug: "metro-manila",
    citySlug: "manila",
  },
  {
    label: "Davao City",
    provinceSlug: "davao-del-sur",
    citySlug: "davao-city",
  },
  {
    label: "Cebu City",
    provinceSlug: "cebu",
    citySlug: "cebu-city",
  },
  {
    label: "Dumaguete",
    provinceSlug: "negros-oriental",
    citySlug: "dumaguete-city",
  },
  {
    label: "Quezon City",
    provinceSlug: "metro-manila",
    citySlug: "quezon-city",
  },
];

// Value proposition features
const FEATURES = [
  {
    icon: ArrowRight,
    title: "Discover",
    description:
      "Find courts by location, see sports, amenities, and real-time availability in one view.",
  },
  {
    icon: Calendar,
    title: "Reserve",
    description:
      "Book your preferred time slot instantly. No more calls or back-and-forth messaging.",
  },
  {
    icon: CheckCircle,
    title: "Confirm",
    description:
      "Secure P2P payment with owner confirmation. Know your booking is locked in.",
  },
];

interface HomePageClientProps {
  featuredPlaces: PlaceSummary[];
}

export default function HomePageClient({
  featuredPlaces,
}: HomePageClientProps) {
  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="mb-10 max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              KudosCourts
            </p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Find courts near you, faster.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Discover pickleball and multi-sport venues, compare availability,
              and request a booking in minutes.
            </p>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Featured Courts
            </h2>
            <HomeTrackedLink
              href={appRoutes.courts.base}
              className="inline-flex items-center text-primary hover:underline"
              event="funnel.landing_search_submitted"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </HomeTrackedLink>
          </div>
          <HomeSearchForm popularLocations={POPULAR_LOCATIONS} />

          {featuredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No featured courts available yet.</p>
              <HomeTrackedLink
                href={appRoutes.courts.base}
                className="text-accent hover:underline mt-2 inline-block"
                event="funnel.landing_search_submitted"
              >
                Browse all courts
              </HomeTrackedLink>
            </div>
          )}
        </Container>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Why KudosCourts
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We&apos;re solving the fragmentation in court sports, starting
              with pickleball. No more messaging 5 different Facebook pages to
              find an open slot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-md transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary">
        <Container>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to play?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Find available courts at top venues and book your next game fast.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-10 rounded-xl font-heading font-semibold text-primary"
              >
                <Link href={appRoutes.courts.base}>Browse All Courts</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </PublicShell>
  );
}
