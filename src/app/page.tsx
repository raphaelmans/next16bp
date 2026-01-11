"use client";

import { ArrowRight, Calendar, CheckCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourtCardCourt } from "@/shared/components/kudos";
import { CourtCard, CourtCardSkeleton } from "@/shared/components/kudos";
import { Container, PublicShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

// Popular locations for quick access
const POPULAR_LOCATIONS = [
  { name: "Metro Manila", city: "metro-manila" },
  { name: "Cebu", city: "cebu" },
  { name: "Davao", city: "davao" },
  { name: "Laguna", city: "laguna" },
  { name: "Pampanga", city: "pampanga" },
];

// Value proposition features
const FEATURES = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Find courts by location, see photos, amenities, and real-time availability all in one place.",
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

// TODO: Fetch featured courts from court.search API
// For now, using mock data
const MOCK_FEATURED_COURTS: CourtCardCourt[] = [
  {
    id: "featured-1",
    name: "Kudos Sports Complex",
    address: "123 Main St, Makati City",
    city: "Makati",
    type: "RESERVABLE",
    isFree: false,
    pricePerHourCents: 20000,
    currency: "PHP",
  },
  {
    id: "featured-2",
    name: "BGC Pickleball Arena",
    address: "456 High Street, Taguig",
    city: "Taguig",
    type: "RESERVABLE",
    isFree: true,
  },
  {
    id: "featured-3",
    name: "Quezon City Sports Club",
    address: "789 Commonwealth Ave",
    city: "Quezon City",
    type: "CURATED",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingFeatured] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `${appRoutes.courts.base}?q=${encodeURIComponent(searchQuery.trim())}`,
      );
    } else {
      router.push(appRoutes.courts.base);
    }
  };

  const handleLocationClick = (city: string) => {
    router.push(`${appRoutes.courts.base}?city=${encodeURIComponent(city)}`);
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
              The unified platform for players and court owners.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10">
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by city or court name..."
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
                <span key={location.city} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleLocationClick(location.city)}
                    className="text-accent hover:text-accent/80 hover:underline transition-colors cursor-pointer"
                  >
                    {location.name}
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

      {/* Featured Courts Section */}
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
                <CourtCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          ) : MOCK_FEATURED_COURTS.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_FEATURED_COURTS.map((court, index) => (
                <div
                  key={court.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CourtCard court={court} variant="featured" />
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
              Ready to hit the court?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Find available courts near you and book your next game in seconds.
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
