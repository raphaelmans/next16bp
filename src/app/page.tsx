"use client";

import { ArrowRight, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFeaturedPlaces } from "@/features/discovery/hooks";
import { PlaceCard, PlaceCardSkeleton } from "@/shared/components/kudos";
import { Container, PublicShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import { URLQueryBuilder } from "@/shared/lib/url-query-builder";

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

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: featuredPlaces = [], isLoading: isLoadingFeatured } =
    useFeaturedPlaces(3);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    trackEvent({
      event: "funnel.landing_search_submitted",
      properties: { query: query || undefined },
    });
    if (query) {
      const search = new URLQueryBuilder().addParams({ q: query }).build();
      router.push(`${appRoutes.courts.base}?${search}`);
    } else {
      router.push(appRoutes.courts.base);
    }
  };

  const handleLocationClick = (provinceSlug: string, citySlug: string) => {
    trackEvent({
      event: "funnel.landing_search_submitted",
      properties: {
        province: provinceSlug,
        city: citySlug,
      },
    });
    const search = new URLQueryBuilder()
      .addParams({
        province: provinceSlug,
        city: citySlug,
      })
      .build();
    router.push(`${appRoutes.courts.base}?${search}`);
  };

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Featured Courts
            </h2>
            <Link
              href={appRoutes.courts.base}
              className="inline-flex items-center text-primary hover:underline"
              onClick={() =>
                trackEvent({ event: "funnel.landing_search_submitted" })
              }
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by city, court, or venue..."
                className="h-12 flex-1 rounded-xl border border-border/60 bg-background px-4 text-base shadow-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-12 px-6">
                  Search
                </Button>
                {POPULAR_LOCATIONS.map((location) => (
                  <Button
                    key={location.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12"
                    onClick={() =>
                      handleLocationClick(
                        location.provinceSlug,
                        location.citySlug,
                      )
                    }
                  >
                    {location.label}
                  </Button>
                ))}
              </div>
            </div>
          </form>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No featured courts available yet.</p>
              <Link
                href={appRoutes.courts.base}
                className="text-accent hover:underline mt-2 inline-block"
                onClick={() =>
                  trackEvent({ event: "funnel.landing_search_submitted" })
                }
              >
                Browse all courts
              </Link>
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
