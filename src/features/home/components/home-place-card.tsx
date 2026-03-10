import { MapPin, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import type { PlaceSummary } from "@/features/discovery/helpers";
import { cn } from "@/lib/utils";

interface HomePlaceCardProps {
  place: PlaceSummary;
  className?: string;
  href?: string | null;
  imageLoading?: "eager" | "lazy";
}

const MAX_BADGES = 3;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function HomePlaceCard({
  place,
  className,
  href,
  imageLoading = "lazy",
}: HomePlaceCardProps) {
  const placeHref = href ?? appRoutes.places.detail(place.slug ?? place.id);
  const visibleSports = place.sports.slice(0, MAX_BADGES);
  const hiddenCount = Math.max(0, place.sports.length - MAX_BADGES);
  const lowestPriceCents = place.lowestPriceCents;
  const currency = place.currency;
  const showPrice =
    typeof lowestPriceCents === "number" &&
    typeof currency === "string" &&
    currency.length > 0;

  const cardContent = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {place.coverImageUrl ? (
          <Image
            src={place.coverImageUrl}
            alt={place.name}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            loading={imageLoading}
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-2xl font-heading text-primary/40">KC</div>
          </div>
        )}

        <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/85 p-1.5 shadow-md backdrop-blur">
          {place.logoUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={place.logoUrl}
                alt={`${place.name} logo`}
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          ) : (
            <span className="text-xs font-heading font-semibold text-foreground">
              {getInitials(place.name)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {place.name}
            </h3>
            {place.courtCount ? (
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                {place.courtCount} courts
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {(place.featuredRank ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                <Star className="h-3 w-3" />
                Featured
              </span>
            ) : null}
            {place.placeType === "RESERVABLE" &&
            place.verificationStatus === "VERIFIED" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-1 font-medium text-success">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            ) : null}
            {place.placeType === "CURATED" ? (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                Curated
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {place.address}, {place.city}
          </span>
        </div>

        {visibleSports.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleSports.map((sport) => (
              <span
                key={sport.id}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {sport.name}
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                +{hiddenCount} more
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {showPrice ? (
            <div>
              <p className="font-heading text-base font-semibold text-foreground">
                {formatCurrency(lowestPriceCents, currency)}
              </p>
              <p className="text-xs text-muted-foreground">starting price</p>
            </div>
          ) : null}

          <span className="ml-auto inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-heading font-semibold text-primary-foreground">
            View venue
          </span>
        </div>
      </div>
    </>
  );

  const cardClassName = cn(
    "group block overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
    className,
  );

  if (!placeHref) {
    return <div className={cardClassName}>{cardContent}</div>;
  }

  return (
    <Link href={placeHref} className={cardClassName}>
      {cardContent}
    </Link>
  );
}
