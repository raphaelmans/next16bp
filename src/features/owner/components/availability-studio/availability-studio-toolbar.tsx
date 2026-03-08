"use client";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type Option = {
  id: string;
  name: string;
};

type CourtOption = {
  id: string;
  label: string;
};

type AvailabilityStudioToolbarProps = {
  placeId: string;
  places: Option[];
  courtId: string;
  courts: CourtOption[];
  courtsLoading: boolean;
  onPlaceChange: (placeId: string) => void;
  onCourtChange: (courtId: string) => void;
};

export function AvailabilityStudioToolbar({
  placeId,
  places,
  courtId,
  courts,
  courtsLoading,
  onPlaceChange,
  onCourtChange,
}: AvailabilityStudioToolbarProps) {
  return (
    <Card className="flex flex-wrap items-start justify-start gap-4 p-6">
      <div className="w-full space-y-2 sm:min-w-[220px] sm:w-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Venue
        </p>
        <Select value={placeId} onValueChange={onPlaceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a venue" />
          </SelectTrigger>
          <SelectContent>
            {places.map((place) => (
              <SelectItem key={place.id} value={place.id}>
                {place.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full space-y-2 sm:min-w-[220px] sm:w-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Court
        </p>
        <Select
          value={courtId}
          onValueChange={onCourtChange}
          disabled={!placeId || courtsLoading}
        >
          <SelectTrigger className="relative pr-9">
            <SelectValue
              placeholder={
                courtsLoading ? "Loading courts..." : "Select a court"
              }
            />
            {courtsLoading ? (
              <Spinner className="pointer-events-none absolute right-8 size-4 text-muted-foreground" />
            ) : null}
          </SelectTrigger>
          <SelectContent>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
