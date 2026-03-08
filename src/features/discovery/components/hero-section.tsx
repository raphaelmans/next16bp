"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { URLQueryBuilder } from "@/common/url-query-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POPULAR_LOCATIONS = [
  { name: "Manila", slug: "manila" },
  { name: "Cebu", slug: "cebu" },
  { name: "Davao", slug: "davao" },
  { name: "Makati", slug: "makati" },
];

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleLocationClick = (slug: string) => {
    const search = new URLQueryBuilder().addParams({ city: slug }).build();
    router.push(`${appRoutes.courts.base}?${search}`);
  };

  return (
    <section
      className={cn(
        "relative py-20 md:py-32",
        "bg-gradient-to-b from-primary/5 via-background to-background",
        className,
      )}
    >
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Title */}
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight">
          Find Courts Near You
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and book courts near you. Compare courts, sports, and
          availability signals in one spot.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by city, court, or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-32 text-lg rounded-xl shadow-md border-border/50"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Popular Locations */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Popular:</span>
          {POPULAR_LOCATIONS.map((location) => (
            <Button
              key={location.slug}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => handleLocationClick(location.slug)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {location.name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
