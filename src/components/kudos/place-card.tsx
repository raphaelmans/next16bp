"use client";

import { MapPin, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { formatCurrency } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkButton } from "@/features/discovery/components/bookmark-button";
import { cn } from "@/lib/utils";

export interface PlaceSport {
  id: string;
  name: string;
  slug?: string;
}

export interface PlaceCardPlace {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  logoUrl?: string;
  sports: PlaceSport[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string;
  placeType?: "CURATED" | "RESERVABLE";
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
  featuredRank?: number;
  provinceRank?: number;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export type PlaceCardLinkScope = "card" | "title" | "none";

interface PlaceCardProps {
  place: PlaceCardPlace;
  variant?: "default" | "featured" | "compact";
  showPrice?: boolean;
  showCTA?: boolean;
  linkScope?: PlaceCardLinkScope;
  className?: string;
  isMediaLoading?: boolean;
  isMetaLoading?: boolean;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  onBookmarkToggle?: () => void;
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

export function PlaceCard({
  place,
  variant = "default",
  showPrice = true,
  showCTA = true,
  linkScope = "card",
  className,
  isMediaLoading = false,
  isMetaLoading = false,
  isBookmarked,
  isBookmarkPending,
  onBookmarkToggle,
}: PlaceCardProps) {
  const imageUrl = place.coverImageUrl;
  const logoUrl = place.logoUrl?.trim();
  const logoFallback = getInitials(place.name);
  const aspectRatio = variant === "featured" ? "aspect-[4/3]" : "aspect-[16/9]";
  const visibleSports = place.sports.slice(0, MAX_BADGES);
  const hiddenCount = Math.max(0, place.sports.length - MAX_BADGES);
  const placeHref = appRoutes.places.detail(place.slug ?? place.id);
  const logoSize = variant === "compact" ? "h-7 w-7" : "h-10 w-10";
  const logoPadding = variant === "compact" ? "p-1" : "p-1.5";
  const logoText = variant === "compact" ? "text-[10px]" : "text-xs";
  const logoOffset = variant === "compact" ? "top-2 left-2" : "top-3 left-3";

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

  const isVerifiedReservable =
    place.placeType === "RESERVABLE" && place.verificationStatus === "VERIFIED";
  const isCurated = place.placeType === "CURATED";
  const isGlobalFeatured = (place.featuredRank ?? 0) > 0;
  const isProvinceFeatured = (place.provinceRank ?? 0) > 0;
  const showStatusRow =
    variant !== "compact" &&
    (isVerifiedReservable ||
      isCurated ||
      isGlobalFeatured ||
      isProvinceFeatured ||
      isMetaLoading);
  const showVerificationSkeleton =
    isMetaLoading && place.placeType === "RESERVABLE" && !isVerifiedReservable;
  const showSportsRow = isMetaLoading || place.sports.length > 0;

  const cardContent = (
    <Card
      className={cn(
        "group h-full overflow-hidden p-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
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
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-primary/40 font-heading text-2xl">KC</div>
          </div>
        )}
        {isMediaLoading && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full border border-border/60 bg-background/85 shadow-md backdrop-blur",
            logoSize,
            logoPadding,
            logoOffset,
          )}
        >
          {isMediaLoading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : logoUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={logoUrl}
                alt={`${place.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <span
              className={cn(
                "font-heading font-semibold text-foreground",
                logoText,
              )}
            >
              {logoFallback}
            </span>
          )}
        </div>
        {onBookmarkToggle && (
          <BookmarkButton
            variant="overlay"
            isBookmarked={isBookmarked ?? false}
            isPending={isBookmarkPending}
            onToggle={onBookmarkToggle}
          />
        )}
      </div>

      <div
        className={cn(
          "flex h-full flex-col p-4",
          variant === "compact" && "flex-1 py-2 px-3",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <h3
              className={cn(
                "font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors",
                variant === "featured" ? "text-lg" : "text-base",
                variant === "compact" && "text-sm",
              )}
            >
              {title}
            </h3>
            {showStatusRow && (
              <div className="flex flex-wrap items-center gap-2">
                {isGlobalFeatured && (
                  <Badge variant="paid" className="gap-1 text-[10px]">
                    <Star className="h-3 w-3" />
                  </Badge>
                )}
                {isProvinceFeatured && (
                  <Badge variant="paid" className="text-[10px]">
                    Featured
                  </Badge>
                )}
                {isVerifiedReservable && (
                  <Badge variant="success" className="gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {isCurated && (
                  <Badge variant="secondary" className="text-[10px]">
                    Curated
                  </Badge>
                )}
                {showVerificationSkeleton && (
                  <Skeleton className="h-5 w-16 rounded-full" />
                )}
              </div>
            )}
          </div>
          {variant !== "compact" &&
            (isMetaLoading ? (
              <Skeleton className="h-5 w-16 rounded-full" />
            ) : place.courtCount !== undefined && place.courtCount > 0 ? (
              <Badge variant="secondary" className="text-[10px]">
                {place.courtCount} courts
              </Badge>
            ) : null)}
        </div>

        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span
              className={cn(
                "line-clamp-1 font-medium text-foreground",
                variant === "compact" ? "text-xs" : "text-sm",
              )}
            >
              {place.city}
            </span>
            <span className="ml-auto flex items-center gap-0.5 shrink-0">
              {place.averageRating != null &&
              place.reviewCount != null &&
              place.reviewCount > 0 ? (
                <>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span
                    className={cn(
                      "font-medium text-foreground",
                      variant === "compact" ? "text-[11px]" : "text-xs",
                    )}
                  >
                    {place.averageRating.toFixed(1)}
                  </span>
                  <span
                    className={cn(
                      "text-muted-foreground",
                      variant === "compact" ? "text-[10px]" : "text-[11px]",
                    )}
                  >
                    ({place.reviewCount})
                  </span>
                </>
              ) : (
                <>
                  <Star className="h-3 w-3 text-muted-foreground/30" />
                  <span
                    className={cn(
                      "text-muted-foreground/50",
                      variant === "compact" ? "text-[10px]" : "text-[11px]",
                    )}
                  >
                    No reviews
                  </span>
                </>
              )}
            </span>
          </div>
          <div
            className={cn(
              "pl-4 text-muted-foreground line-clamp-1",
              variant === "compact" ? "text-[11px]" : "text-xs",
            )}
          >
            {place.address}
          </div>
        </div>

        {showSportsRow && (
          <div className="mt-3 flex flex-wrap gap-2">
            {isMetaLoading ? (
              <>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </>
            ) : (
              <>
                {visibleSports.map((sport) => (
                  <Badge
                    key={sport.id}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {sport.name}
                  </Badge>
                ))}
                {hiddenCount > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{hiddenCount}
                  </Badge>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {showPrice &&
            (isMetaLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : place.lowestPriceCents !== undefined ? (
              <div>
                <span className="font-heading font-bold text-foreground">
                  From {formatCurrency(place.lowestPriceCents, place.currency)}
                </span>
                <span className="text-muted-foreground text-sm"> /hour</span>
              </div>
            ) : null)}

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
        "h-full overflow-hidden p-0 gap-0 animate-pulse",
        variant === "compact" && "flex flex-row",
      )}
    >
      <div
        className={cn(
          "relative bg-muted",
          aspectRatio,
          variant === "compact" && "w-24 h-24 shrink-0",
        )}
      >
        <div
          className={cn(
            "absolute rounded-full bg-muted-foreground/10",
            variant === "compact"
              ? "h-7 w-7 top-2 left-2"
              : "h-10 w-10 top-3 left-3",
          )}
        />
      </div>

      <div
        className={cn(
          "flex h-full flex-col p-4",
          variant === "compact" && "flex-1 py-2 px-3",
        )}
      >
        {/* Title + court count */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          {variant !== "compact" && (
            <div className="h-5 w-16 bg-muted rounded-full shrink-0" />
          )}
        </div>

        {/* Status badges */}
        {variant !== "compact" && (
          <div className="mt-2 flex gap-2">
            <div className="h-5 w-14 bg-muted rounded-full" />
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
        )}

        {/* City + rating row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>

        {/* Address */}
        <div className="mt-1 h-3 bg-muted rounded w-2/3 ml-4" />

        {/* Sports badges */}
        {variant !== "compact" && (
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 bg-muted rounded-full" />
            <div className="h-5 w-12 bg-muted rounded-full" />
            <div className="h-5 w-14 bg-muted rounded-full" />
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto space-y-3 pt-3">
          {variant !== "compact" && (
            <div className="h-5 bg-muted rounded w-28" />
          )}
          {variant !== "compact" && (
            <div className="h-9 bg-muted rounded w-full" />
          )}
        </div>
      </div>
    </Card>
  );
}
