"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CourtCard,
  type CourtCardCourt,
  MapMarker,
} from "@/shared/components/kudos";

// Note: This is a placeholder implementation.
// In production, integrate with @react-google-maps/api or similar

interface Court extends CourtCardCourt {
  lat: number;
  lng: number;
}

interface CourtMapProps {
  courts: Court[];
  selectedId?: string;
  onSelect?: (court: Court) => void;
  className?: string;
}

export function CourtMap({
  courts,
  selectedId,
  onSelect,
  className,
}: CourtMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedCourt = courts.find((c) => c.id === selectedId);

  return (
    <div
      className={cn("relative h-[600px] rounded-xl overflow-hidden", className)}
    >
      {/* Map Container - Placeholder */}
      <div className="absolute inset-0 bg-muted">
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          {/* In production, render Google Maps here */}
          <div className="text-center">
            <p className="text-lg font-medium">Map View</p>
            <p className="text-sm">
              Google Maps integration will be added here
            </p>
          </div>
        </div>

        {/* Marker Overlay (simulated positions) */}
        <div className="absolute inset-0 pointer-events-none">
          {courts.map((court, index) => {
            // Simulate marker positions in a grid
            const row = Math.floor(index / 4);
            const col = index % 4;
            const top = 20 + row * 25;
            const left = 15 + col * 20;

            return (
              <button
                type="button"
                key={court.id}
                className="absolute pointer-events-auto bg-transparent border-none p-0"
                style={{ top: `${top}%`, left: `${left}%` }}
                onMouseEnter={() => setHoveredId(court.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect?.(court)}
              >
                <MapMarker
                  price={
                    court.pricePerHourCents
                      ? `${(court.pricePerHourCents / 100).toFixed(0)}`
                      : "Free"
                  }
                  isSelected={court.id === selectedId || court.id === hoveredId}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar with court cards */}
      <div className="absolute top-4 left-4 bottom-4 w-80 overflow-auto space-y-3 z-10">
        {courts.map((court) => (
          <button
            type="button"
            key={court.id}
            className={cn(
              "w-full text-left cursor-pointer transition-all bg-transparent border-none p-0",
              court.id === selectedId && "ring-2 ring-primary rounded-xl",
            )}
            onClick={() => onSelect?.(court)}
          >
            <CourtCard court={court} variant="compact" showCTA={false} />
          </button>
        ))}
      </div>

      {/* Selected Court Detail (bottom panel) */}
      {selectedCourt && (
        <Card className="absolute bottom-4 right-4 left-[352px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold">
                {selectedCourt.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedCourt.address}
              </p>
            </div>
            <a
              href={`/courts/${selectedCourt.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View Details
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
