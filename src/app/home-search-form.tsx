"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { appRoutes } from "@/shared/lib/app-routes";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import { URLQueryBuilder } from "@/shared/lib/url-query-builder";

interface PopularLocation {
  label: string;
  provinceSlug: string;
  citySlug: string;
}

interface HomeSearchFormProps {
  popularLocations: PopularLocation[];
}

export function HomeSearchForm({ popularLocations }: HomeSearchFormProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
    const search = new URLQueryBuilder()
      .addParams({
        province: provinceSlug,
        city: citySlug,
      })
      .build();
    router.push(`${appRoutes.courts.base}?${search}`);
  };

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
              onClick={() =>
                handleLocationClick(location.provinceSlug, location.citySlug)
              }
            >
              {location.label}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
