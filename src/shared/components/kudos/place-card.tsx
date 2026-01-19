"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appRoutes } from "@/shared/lib/app-routes";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import { formatCurrency } from "@/shared/lib/format";

export interface PlaceSport {
  id: string;
  name: string;
  slug?: string;
}

export interface PlaceCardPlace {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  sports: PlaceSport[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string;
}

export type PlaceCardLinkScope = "card" | "title" | "none";

interface PlaceCardProps {
  place: PlaceCardPlace;
  variant?: "default" | "featured" | "compact";
  showPrice?: boolean;
  showCTA?: boolean;
  linkScope?: PlaceCardLinkScope;
  className?: string;
}

const MAX_BADGES = 3;

export function PlaceCard({
  place,
  variant = "default",
  showPrice = true,
  showCTA = true,
  linkScope = "card",
  className,
}: PlaceCardProps) {
  const imageUrl = place.coverImageUrl;
  const aspectRatio = variant === "featured" ? "aspect-[4/3]" : "aspect-[16/9]";
  const visibleSports = place.sports.slice(0, MAX_BADGES);
  const hiddenCount = Math.max(0, place.sports.length - MAX_BADGES);
  const placeHref = appRoutes.courts.detail(place.id);

  const handlePlaceClick = () =>
    trackEvent({
      event: "funnel.discovery_place_clicked",
      properties: { placeId: place.id },
    });

  const title =
    linkScope === "title" ? (
      <Link
        href={placeHref}
        onClick={(event) => {
          event.stopPropagation();
          handlePlaceClick();
        }}
        className="block"
      >
        {place.name}
      </Link>
    ) : (
      place.name
    );

  const cardContent = (
    <Card
      className={cn(
        "group h-full overflow-hidden p-0 gap-0",
        variant === "compact" && "flex flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          aspectRatio,
          variant === "compact" && "w-24 h-24 shrink-0",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-primary/40 font-heading text-2xl">KC</div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex h-full flex-col p-4",
          variant === "compact" && "flex-1 py-2 px-3",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors",
              variant === "featured" ? "text-lg" : "text-base",
              variant === "compact" && "text-sm",
            )}
          >
            {title}
          </h3>
          {variant !== "compact" &&
            place.courtCount !== undefined &&
            place.courtCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {place.courtCount} courts
              </Badge>
            )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 text-accent shrink-0" />
          <span
            className={cn(
              "line-clamp-1",
              variant === "compact" ? "text-xs" : "text-sm",
            )}
          >
            {place.city}
          </span>
        </div>

        {place.sports.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleSports.map((sport) => (
              <Badge key={sport.id} variant="outline" className="text-[10px]">
                {sport.name}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                +{hiddenCount}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {showPrice && place.lowestPriceCents !== undefined && (
            <div>
              <span className="font-heading font-bold text-foreground">
                From {formatCurrency(place.lowestPriceCents, place.currency)}
              </span>
              <span className="text-muted-foreground text-sm"> /hour</span>
            </div>
          )}

          {showCTA && variant !== "compact" && (
            <Button size="sm" className="w-full">
              View Courts
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (linkScope === "card") {
    return (
      <Link href={placeHref} className="block" onClick={handlePlaceClick}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export function PlaceCardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "featured" | "compact";
}) {
  const aspectRatio = variant === "featured" ? "aspect-[4/3]" : "aspect-[16/9]";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 gap-0 animate-pulse",
        variant === "compact" && "flex flex-row",
      )}
    >
      <div
        className={cn(
          "bg-muted",
          aspectRatio,
          variant === "compact" && "w-24 h-24 shrink-0",
        )}
      />

      <div
        className={cn(
          "p-4 space-y-2",
          variant === "compact" && "flex-1 py-2 px-3",
        )}
      >
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        {variant !== "compact" && (
          <div className="h-8 bg-muted rounded w-full mt-3" />
        )}
      </div>
    </Card>
  );
}
