"use client";

import { MapPin, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { formatCurrencyWhole } from "@/common/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface CoachDetailHeroProps {
  coach: {
    name: string;
    tagline?: string | null;
    city?: string | null;
    province?: string | null;
    baseHourlyRateCents?: number | null;
    baseHourlyRateCurrency: string;
    featuredRank: number;
  };
  media: {
    avatarUrl: string | null;
    primaryPhotoUrl: string | null;
  } | null;
  meta: {
    sports: { id: string; slug: string; name: string }[];
    averageRating: number | null;
    reviewCount: number;
    verified: boolean;
  };
  photos: { url: string; displayOrder: number }[];
}

export function CoachDetailHero({
  coach,
  media,
  meta,
  photos,
}: CoachDetailHeroProps) {
  const heroImage =
    photos.length > 0
      ? photos[0].url
      : (media?.primaryPhotoUrl ?? media?.avatarUrl);
  const locationLabel = [coach.city, coach.province].filter(Boolean).join(", ");
  const rateLabel =
    typeof coach.baseHourlyRateCents === "number"
      ? `${formatCurrencyWhole(coach.baseHourlyRateCents, coach.baseHourlyRateCurrency)}/hr`
      : null;
  const rating =
    typeof meta.averageRating === "number"
      ? meta.averageRating.toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={coach.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.28),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(29,78,216,0.65))]" />
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm"
            >
              +{photos.length - 1} photos
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar size="lg" className="border-2 border-border shadow-sm">
            <AvatarImage src={media?.avatarUrl ?? undefined} alt={coach.name} />
            <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {coach.name}
              </h1>
              {meta.verified && (
                <ShieldCheck className="h-5 w-5 text-primary" />
              )}
            </div>
            {coach.tagline && (
              <p className="mt-1 text-muted-foreground">{coach.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {locationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {locationLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {rating
                  ? `${rating} (${meta.reviewCount} review${meta.reviewCount === 1 ? "" : "s"})`
                  : "New profile"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {rateLabel && (
            <div className="text-lg font-semibold">{rateLabel}</div>
          )}
          {coach.featuredRank > 0 && (
            <Badge variant="secondary">Featured coach</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {meta.sports.map((sport) => (
          <Badge key={sport.id} variant="secondary">
            {sport.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
