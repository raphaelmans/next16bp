import { ArrowRight, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { POPULAR_DISCOVERY_LINKS } from "@/features/home/constants/popular-discovery-links";

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
  const buildLocationHref = (provinceSlug: string, citySlug: string) =>
    `/courts/locations/${provinceSlug}/${citySlug}`;

  if (variant === "hero") {
    return (
      <div>
        <form action={appRoutes.courts.base} method="GET">
          <div className="flex items-center rounded-2xl border-[1.5px] border-border bg-card p-1.5 pl-5 shadow-sm transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_7%,transparent),0_8px_28px_color-mix(in_oklch,var(--color-primary)_9%,transparent)] focus-within:-translate-y-0.5 max-w-[470px]">
            <Search className="h-[18px] w-[18px] text-muted-foreground/60 mr-2.5 shrink-0" />
            <input
              name="q"
              type="text"
              placeholder='Try "Cebu City" or "badminton"...'
              className="flex-1 border-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50 min-w-0"
            />
            <Button
              type="submit"
              className="rounded-xl px-6 py-3 font-heading font-semibold text-sm"
            >
              Search Venues
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium font-heading text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
            >
              <MapPin className="h-[11px] w-[11px] text-primary" />
              {location.label}
            </Link>
          ))}
          <Link
            href={appRoutes.courts.base}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium font-heading text-primary transition-all hover:text-primary/80"
          >
            View all Venues
            <ArrowRight className="h-[11px] w-[11px]" />
          </Link>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-[7px] items-center">
          <span className="text-xs text-muted-foreground/60 font-medium font-heading">
            Explore:
          </span>
          <Link
            href={appRoutes.coaches.base}
            className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium font-heading text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
          >
            Find Coaches
          </Link>
          {POPULAR_DISCOVERY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-9 items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium font-heading text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form action={appRoutes.courts.base} method="GET" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          type="text"
          placeholder="Search by city, sport, or court..."
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
