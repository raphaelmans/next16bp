"use client";

import { MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { formatCurrencyWhole } from "@/common/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type {
  PublicDiscoveryCoachCardMedia,
  PublicDiscoveryCoachSummary,
} from "../public-coaches-data";

const SESSION_TYPE_LABELS = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  GROUP: "Group",
} as const;

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

interface DiscoveryCoachCardProps {
  coach: PublicDiscoveryCoachSummary;
  media?: PublicDiscoveryCoachCardMedia;
}

export function DiscoveryCoachCard({ coach, media }: DiscoveryCoachCardProps) {
  const href = appRoutes.coaches.detail(coach.slug ?? coach.id);
  const heroImage = media?.primaryPhotoUrl ?? media?.avatarUrl;
  const rating =
    typeof coach.meta?.averageRating === "number"
      ? coach.meta.averageRating.toFixed(1)
      : null;
  const rateLabel =
    typeof coach.baseHourlyRateCents === "number"
      ? `${formatCurrencyWhole(coach.baseHourlyRateCents, coach.currency ?? "PHP")}/hr`
      : "Rate on request";
  const locationLabel = [coach.city, coach.province].filter(Boolean).join(", ");
  const visibleSports = coach.meta?.sports.slice(0, 3) ?? [];
  const extraSportCount =
    (coach.meta?.sports.length ?? 0) - visibleSports.length;
  const sessionTypes = coach.meta?.sessionTypes ?? [];

  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-card py-0 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-muted">
          {heroImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.28),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(29,78,216,0.65))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {coach.meta?.verified ? (
              <Badge className="gap-1 bg-background/95 text-foreground hover:bg-background/95">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Verified
              </Badge>
            ) : null}
            {coach.featuredRank > 0 ? (
              <Badge variant="secondary">Featured coach</Badge>
            ) : null}
          </div>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-heading text-2xl font-semibold text-white">
                {coach.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-white/80">
                {coach.tagline ??
                  "Personalized coaching sessions tailored to your goals."}
              </p>
            </div>
            <Avatar size="lg" className="border-2 border-white/70 shadow-md">
              <AvatarImage src={media?.avatarUrl} alt={coach.name} />
              <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </Link>

      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {locationLabel || "Location shared on request"}
            </span>
          </div>
          <div className="shrink-0 text-sm font-semibold text-foreground">
            {rateLabel}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleSports.map((sport) => (
            <Badge key={sport.id} variant="secondary">
              {sport.name}
            </Badge>
          ))}
          {extraSportCount > 0 ? (
            <Badge variant="outline">+{extraSportCount} more</Badge>
          ) : null}
          {visibleSports.length === 0 ? (
            <Badge variant="outline">Multi-sport coach</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {rating
              ? `${rating} (${coach.meta?.reviewCount ?? 0})`
              : "New profile"}
          </span>
          {sessionTypes.length > 0 ? (
            <span>
              {sessionTypes
                .slice(0, 2)
                .map((type) => SESSION_TYPE_LABELS[type])
                .join(" · ")}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t border-border/60 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          {coach.meta?.verified
            ? "Credentials and sports are live."
            : "Profile is live and bookable soon."}
        </p>
        <Button asChild size="sm">
          <Link href={href}>View profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
