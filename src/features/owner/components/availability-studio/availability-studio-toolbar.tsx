"use client";

import { CalendarIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  placeTimeZone: string;
  onPlaceChange: (placeId: string) => void;
  onCourtChange: (courtId: string) => void;
  onToday: () => void;
};

export function AvailabilityStudioToolbar({
  placeId,
  places,
  courtId,
  courts,
  courtsLoading,
  placeTimeZone,
  onPlaceChange,
  onCourtChange,
  onToday,
}: AvailabilityStudioToolbarProps) {
  return (
    <Card className="flex flex-wrap items-end gap-4 p-6">
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
              <Loader2 className="pointer-events-none absolute right-8 size-4 animate-spin text-muted-foreground" />
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

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-2">
          <CalendarIcon className="h-3.5 w-3.5" />
          {placeTimeZone}
        </Badge>
        <Button
          type="button"
          variant="outline"
          className="hidden lg:inline-flex"
          onClick={onToday}
        >
          Today
        </Button>
      </div>
    </Card>
  );
}
