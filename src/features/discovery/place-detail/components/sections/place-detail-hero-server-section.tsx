import { Calendar, MapPin, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlaceDetail } from "@/features/discovery/hooks/place-detail";
import { PlaceDetailBookmarkSlot } from "@/features/discovery/place-detail/components/place-detail-bookmark-slot";

type PlaceDetailHeroServerSectionProps = {
  place: PlaceDetail;
  showBooking: boolean;
  showVerificationBadge: boolean;
  isCurated: boolean;
  directionsUrl: string;
  hasCallCta: boolean;
  callHref: string;
};

export function PlaceDetailHeroServerSection({
  place,
  showBooking,
  showVerificationBadge,
  isCurated,
  directionsUrl,
  hasCallCta,
  callHref,
}: PlaceDetailHeroServerSectionProps) {
  const logoUrl = place.logoUrl?.trim();
  const logoFallback = place.name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-2 border-b border-border/60 pb-4">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50 p-1">
          {logoUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={logoUrl}
                alt={`${place.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <span className="font-heading text-xs font-semibold text-foreground">
              {logoFallback}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="font-heading text-xl font-semibold text-foreground leading-tight sm:text-2xl">
              {place.name}
            </h1>
            {showVerificationBadge && (
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
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {place.city}
            {place.address ? ` · ${place.address}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showBooking && (
          <Button asChild type="button" size="sm">
            <a href="#availability-studio">
              <Calendar className="h-4 w-4" />
              Check availability
            </a>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4" />
            Directions
          </a>
        </Button>
        {hasCallCta && (
          <Button asChild variant="outline" size="sm">
            <a href={callHref}>
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
        )}
        <PlaceDetailBookmarkSlot placeId={place.id} />
      </div>
    </div>
  );
}
