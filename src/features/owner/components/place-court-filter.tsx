"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OwnerCourt, OwnerPlace } from "../hooks";

interface PlaceCourtFilterProps {
  places: OwnerPlace[];
  courts: OwnerCourt[];
  placeId: string;
  courtId: string;
  onPlaceChange: (placeId: string) => void;
  onCourtChange: (courtId: string) => void;
  compact?: boolean;
}

export function PlaceCourtFilter({
  places,
  courts,
  placeId,
  courtId,
  onPlaceChange,
  onCourtChange,
  compact = false,
}: PlaceCourtFilterProps) {
  const filteredCourts = React.useMemo(() => {
    if (!placeId || placeId === "all") return courts;
    return courts.filter((court) => court.placeId === placeId);
  }, [courts, placeId]);

  React.useEffect(() => {
    if (!courtId || courtId === "all") return;
    const exists = filteredCourts.some((court) => court.id === courtId);
    if (!exists) {
      onCourtChange("");
    }
  }, [courtId, filteredCourts, onCourtChange]);

  const handlePlaceValueChange = (value: string) => {
    onPlaceChange(value === "all" ? "" : value);
  };

  const handleCourtValueChange = (value: string) => {
    onCourtChange(value === "all" ? "" : value);
  };

  return (
    <div
      className={
        compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-[220px_220px]"
      }
    >
      <Select value={placeId || "all"} onValueChange={handlePlaceValueChange}>
        <SelectTrigger className={compact ? "h-8 w-full" : "w-full"}>
          <SelectValue placeholder="All venues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          {places.map((place) => (
            <SelectItem key={place.id} value={place.id}>
              {place.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={courtId || "all"} onValueChange={handleCourtValueChange}>
        <SelectTrigger className={compact ? "h-8 w-full" : "w-full"}>
          <SelectValue placeholder="All venues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          {filteredCourts.map((court) => (
            <SelectItem key={court.id} value={court.id}>
              {court.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
