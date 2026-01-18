"use client";

import { ArrowRight, Calendar, CheckCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeaturedPlaces } from "@/features/discovery/hooks";
import { PlaceCard, PlaceCardSkeleton } from "@/shared/components/kudos";
import { Container, PublicShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
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
    icon: Search,
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
    if (query) {
      const search = new URLQueryBuilder().addParams({ q: query }).build();
      router.push(`${appRoutes.courts.base}?${search}`);
    } else {
      router.push(appRoutes.courts.base);
    }
  };

  const handleLocationClick = (provinceSlug: string, citySlug: string) => {
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
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Discover Pickleball Courts{" "}
              <span className="text-primary">Near You</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Find and book courts in seconds. No more calls, no more waiting.
              The unified platform for players and venue owners.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10">
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by city, court, or venue name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 text-base rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-8 rounded-xl font-heading font-semibold"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Popular Locations */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {POPULAR_LOCATIONS.map((location, index) => (
                <span
                  key={`${location.provinceSlug}-${location.citySlug}`}
                  className="flex items-center"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleLocationClick(
                        location.provinceSlug,
                        location.citySlug,
                      )
                    }
                    className="text-accent hover:text-accent/80 hover:underline transition-colors cursor-pointer"
                  >
                    {location.label}
                  </button>
                  {index < POPULAR_LOCATIONS.length - 1 && (
                    <span className="text-muted-foreground ml-2">-</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Featured Places Section */}
      <section className="py-16 bg-muted/30">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Featured Courts
            </h2>
            <Link
              href={appRoutes.courts.base}
              className="inline-flex items-center text-primary hover:underline"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <PlaceCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          ) : featuredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlaces.map((place, index) => (
                <div
                  key={place.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PlaceCard place={place} variant="featured" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No featured courts available yet.</p>
              <Link
                href={appRoutes.courts.base}
                className="text-accent hover:underline mt-2 inline-block"
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
              We&apos;re solving the fragmentation in the pickleball community.
              No more messaging 5 different Facebook pages to find an open slot.
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
