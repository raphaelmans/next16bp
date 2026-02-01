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
      className={cn("relative h-[600px] rounded-xl overflow-hidden", className)}
    >
      <div className="absolute inset-0">
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
      </div>

      {openInMapsUrl && (
        <div className="absolute top-4 right-4 z-10">
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

      <ScrollArea className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex gap-3">
          {places.map((place) => (
            <button
              type="button"
              key={place.id}
              className={cn(
                "w-72 shrink-0 text-left cursor-pointer transition-all bg-transparent border-none p-0",
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
