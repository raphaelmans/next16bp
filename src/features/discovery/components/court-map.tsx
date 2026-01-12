"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MapMarker,
  PlaceCard,
  type PlaceCardPlace,
} from "@/shared/components/kudos";

interface PlaceMapItem extends PlaceCardPlace {
  lat: number;
  lng: number;
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedPlace = places.find((place) => place.id === selectedId);

  return (
    <div
      className={cn("relative h-[600px] rounded-xl overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-muted">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Map View</p>
            <p className="text-sm">
              Google Maps integration will be added here
            </p>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {places.map((place, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const top = 20 + row * 25;
            const left = 15 + col * 20;

            return (
              <button
                type="button"
                key={place.id}
                className="absolute pointer-events-auto bg-transparent border-none p-0"
                style={{ top: `${top}%`, left: `${left}%` }}
                onMouseEnter={() => setHoveredId(place.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect?.(place)}
              >
                <MapMarker
                  price={
                    place.lowestPriceCents !== undefined
                      ? `${(place.lowestPriceCents / 100).toFixed(0)}`
                      : "Rates"
                  }
                  isSelected={place.id === selectedId || place.id === hoveredId}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute top-4 left-4 bottom-4 w-80 overflow-auto space-y-3 z-10">
        {places.map((place) => (
          <button
            type="button"
            key={place.id}
            className={cn(
              "w-full text-left cursor-pointer transition-all bg-transparent border-none p-0",
              place.id === selectedId && "ring-2 ring-primary rounded-xl",
            )}
            onClick={() => onSelect?.(place)}
          >
            <PlaceCard place={place} variant="compact" showCTA={false} />
          </button>
        ))}
      </div>

      {selectedPlace && (
        <Card className="absolute bottom-4 right-4 left-[352px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold">
                {selectedPlace.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedPlace.address}
              </p>
            </div>
            <span className="text-sm font-medium text-primary">
              View Details
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
