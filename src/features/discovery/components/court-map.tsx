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
import { ScrollArea } from "@/components/ui/scroll-area";
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
        "flex flex-col gap-4 md:flex-row md:gap-0 md:h-[600px] md:min-h-0 md:rounded-xl md:overflow-hidden md:border md:border-border/60",
        className,
      )}
    >
      <div className="relative h-[320px] overflow-hidden rounded-xl border border-border/60 sm:h-[360px] md:h-full md:flex-1 md:min-w-0 md:rounded-none md:border-0">
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
          <div className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4">
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

      <ScrollArea className="w-full md:h-full md:min-h-0 md:w-[360px] md:shrink-0 md:border-l md:border-border/60 lg:w-[420px] [&_[data-slot=scroll-area-scrollbar]]:hidden md:[&_[data-slot=scroll-area-scrollbar]]:flex">
        <div className="flex flex-col gap-3 md:p-4">
          {places.map((place) => (
            <button
              type="button"
              key={place.id}
              className={cn(
                "w-full text-left cursor-pointer transition-all bg-transparent border-none p-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                place.id === selectedPlaceId &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
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
      </ScrollArea>
    </div>
  );
}
