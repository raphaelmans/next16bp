"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { URLQueryBuilder } from "@/common/url-query-builder";
import { Button } from "@/components/ui/button";

interface PopularLocation {
  label: string;
  provinceSlug: string;
  citySlug: string;
}

interface HomeSearchFormProps {
  popularLocations: PopularLocation[];
  variant?: "inline" | "hero";
}

export function HomeSearchForm({
  popularLocations,
  variant = "inline",
}: HomeSearchFormProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const buildLocationHref = (provinceSlug: string, citySlug: string) =>
    `/courts/locations/${provinceSlug}/${citySlug}`;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  };

  if (variant === "hero") {
    return (
      <div>
        <form onSubmit={handleSearch}>
          <div className="flex items-center rounded-2xl border-[1.5px] border-border bg-card p-1.5 pl-5 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_7%,transparent),0_8px_28px_color-mix(in_oklch,var(--color-primary)_9%,transparent)] focus-within:-translate-y-0.5 max-w-[470px]">
            <Search className="h-[18px] w-[18px] text-muted-foreground/60 mr-2.5 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder='Try "Cebu City" or "badminton"...'
              className="flex-1 border-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50 min-w-0"
            />
            <Button
              type="submit"
              className="rounded-xl px-6 py-3 font-heading font-semibold text-sm"
            >
              Search Courts
            </Button>
          </div>
        </form>
        <div className="flex flex-wrap gap-[7px] mt-3.5 items-center">
          <span className="text-xs text-muted-foreground/60 font-medium font-heading">
            Popular:
          </span>
          {popularLocations.map((location) => (
            <Link
              key={location.label}
              href={buildLocationHref(location.provinceSlug, location.citySlug)}
              onClick={() =>
                handleLocationClick(location.provinceSlug, location.citySlug)
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium font-heading text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
            >
              <MapPin className="h-[11px] w-[11px] text-primary" />
              {location.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
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
          {popularLocations.map((location) => (
            <Button
              key={location.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-12"
              asChild
            >
              <Link
                href={buildLocationHref(
                  location.provinceSlug,
                  location.citySlug,
                )}
                onClick={() =>
                  handleLocationClick(location.provinceSlug, location.citySlug)
                }
              >
                {location.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
