"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  GoogleMapsEmbed,
  LocationPin,
  PlaceCard,
  type PlaceCardLinkScope,
  type PlaceCardPlace,
} from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PlaceMapItem extends PlaceCardPlace {
  lat?: number | null;
  lng?: number | null;
}

interface PlaceMapProps {
  places: PlaceMapItem[];
  selectedId?: string;
  onSelect?: (place: PlaceMapItem) => void;
  className?: string;
}

export function PlaceMap({
  places,
  selectedId,
  onSelect,
  className,
}: PlaceMapProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null,
  );
  const selectedPlaceId = selectedId ?? internalSelectedId ?? places[0]?.id;
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);
  const hasPlaces = places.length > 0;

  const handleSelect = (place: PlaceMapItem) => {
    if (onSelect) {
      onSelect(place);
      return;
    }
    setInternalSelectedId(place.id);
  };

  const hasCoordinates =
    typeof selectedPlace?.lat === "number" &&
    Number.isFinite(selectedPlace.lat) &&
    typeof selectedPlace?.lng === "number" &&
    Number.isFinite(selectedPlace.lng);

  const mapQuery = selectedPlace
    ? `${selectedPlace.name} ${selectedPlace.address} ${selectedPlace.city}`
    : undefined;

  const openInMapsUrl = selectedPlace
    ? hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery ?? "")}`
    : undefined;

  const mapTitle = selectedPlace ? `${selectedPlace.name} map preview` : "Map";

  if (!hasPlaces) {
    return (
      <div
        className={cn(
          "relative h-[600px] rounded-xl overflow-hidden border border-border/60",
          className,
        )}
      >
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Map View</p>
            <p className="text-sm">No courts available to preview.</p>
          </div>
        </div>
      </div>
    );
  }

  const cardLinkScope: PlaceCardLinkScope = "title";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:relative md:h-[600px] md:rounded-xl md:overflow-hidden",
        className,
      )}
    >
      <div className="relative h-[320px] overflow-hidden rounded-xl border border-border/60 sm:h-[360px] md:absolute md:inset-0 md:h-auto md:rounded-none md:border-0">
        <GoogleMapsEmbed
          title={mapTitle}
          lat={selectedPlace?.lat}
          lng={selectedPlace?.lng}
          query={mapQuery}
          zoom={15}
          allowInteraction={false}
          className="absolute inset-0 h-full w-full rounded-none border-0"
        />
        {selectedPlace && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <LocationPin size={48} className="text-accent drop-shadow-lg" />
          </div>
        )}

        {openInMapsUrl && (
          <div className="absolute top-3 right-3 z-10 sm:top-4 sm:right-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-background/90 backdrop-blur"
            >
              <a href={openInMapsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="md:absolute md:bottom-4 md:left-4 md:right-4 md:z-10">
        <div className="flex flex-col gap-3 md:flex-row">
          {places.map((place) => (
            <button
              type="button"
              key={place.id}
              className={cn(
                "w-full shrink-0 text-left cursor-pointer transition-all bg-transparent border-none p-0 md:w-72",
                place.id === selectedPlaceId &&
                  "ring-2 ring-primary rounded-xl",
              )}
              onClick={() => handleSelect(place)}
            >
              <PlaceCard
                place={place}
                variant="compact"
                showCTA={false}
                linkScope={cardLinkScope}
              />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden md:flex" />
      </ScrollArea>
    </div>
  );
}
