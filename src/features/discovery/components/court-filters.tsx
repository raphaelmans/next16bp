"use client";

import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CourtFiltersProps {
  city?: string;
  type?: string;
  isFree?: boolean;
  amenities?: string[];
  onCityChange: (city: string | undefined) => void;
  onTypeChange: (type: string | undefined) => void;
  onIsFreeChange: (isFree: boolean | undefined) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onClearAll: () => void;
  className?: string;
}

const CITIES = [
  { value: "manila", label: "Manila" },
  { value: "cebu", label: "Cebu" },
  { value: "davao", label: "Davao" },
  { value: "makati", label: "Makati" },
  { value: "quezon-city", label: "Quezon City" },
];

const COURT_TYPES = [
  { value: "CURATED", label: "Curated" },
  { value: "RESERVABLE", label: "Reservable" },
];

const AMENITIES = [
  { value: "parking", label: "Parking" },
  { value: "restrooms", label: "Restrooms" },
  { value: "lights", label: "Lighting" },
  { value: "equipment", label: "Equipment Rental" },
  { value: "water", label: "Water Station" },
];

export function CourtFilters({
  city,
  type,
  isFree,
  amenities = [],
  onCityChange,
  onTypeChange,
  onIsFreeChange,
  onAmenitiesChange,
  onClearAll,
  className,
}: CourtFiltersProps) {
  const hasFilters =
    city || type || isFree !== undefined || amenities.length > 0;

  const handleAmenityToggle = (amenity: string) => {
    if (amenities.includes(amenity)) {
      onAmenitiesChange(amenities.filter((a) => a !== amenity));
    } else {
      onAmenitiesChange([...amenities, amenity]);
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* City */}
      <div className="space-y-2">
        <Label>City</Label>
        <Select
          value={city}
          onValueChange={(v) => onCityChange(v || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Court Type */}
      <div className="space-y-2">
        <Label>Court Type</Label>
        <Select
          value={type}
          onValueChange={(v) => onTypeChange(v || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            {COURT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label>Price</Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="free-courts"
            checked={isFree === true}
            onCheckedChange={(checked) =>
              onIsFreeChange(checked === true ? true : undefined)
            }
          />
          <Label htmlFor="free-courts" className="font-normal cursor-pointer">
            Free courts only
          </Label>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="space-y-2">
          {AMENITIES.map((amenity) => (
            <div key={amenity.value} className="flex items-center gap-2">
              <Checkbox
                id={amenity.value}
                checked={amenities.includes(amenity.value)}
                onCheckedChange={() => handleAmenityToggle(amenity.value)}
              />
              <Label
                htmlFor={amenity.value}
                className="font-normal cursor-pointer"
              >
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {hasFilters && (
        <Button variant="ghost" className="w-full" onClick={onClearAll}>
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className={cn("hidden lg:flex items-center gap-3", className)}>
        <Select
          value={city}
          onValueChange={(v) => onCityChange(v || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(v) => onTypeChange(v || undefined)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {COURT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={isFree ? "default" : "outline"}
          size="sm"
          onClick={() => onIsFreeChange(isFree ? undefined : true)}
        >
          Free Only
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasFilters && (
              <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                {[city, type, isFree, ...amenities].filter(Boolean).length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
