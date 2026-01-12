"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface PlaceFiltersProps {
  city?: string;
  sportId?: string;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onClearAll: () => void;
  className?: string;
}

const CITIES = [
  { value: "Makati", label: "Makati" },
  { value: "Taguig City", label: "Taguig City" },
  { value: "Cebu City", label: "Cebu City" },
  { value: "Quezon City", label: "Quezon City" },
  { value: "Davao", label: "Davao" },
];

export function PlaceFilters({
  city,
  sportId,
  onCityChange,
  onSportChange,
  onClearAll,
  className,
}: PlaceFiltersProps) {
  const hasFilters = city || sportId;
  const trpc = useTRPC();
  const { data: sports = [], isLoading: sportsLoading } = useQuery(
    trpc.sport.list.queryOptions({}),
  );

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>City</Label>
        <Select
          value={city}
          onValueChange={(value) => onCityChange(value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sport</Label>
        <Select
          value={sportId}
          onValueChange={(value) => onSportChange(value || undefined)}
          disabled={sportsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="All sports" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" className="w-full" onClick={onClearAll}>
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className={cn("hidden lg:flex items-center gap-3", className)}>
        <Select
          value={city}
          onValueChange={(value) => onCityChange(value || undefined)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sportId}
          onValueChange={(value) => onSportChange(value || undefined)}
          disabled={sportsLoading}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasFilters && (
              <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                {[city, sportId].filter(Boolean).length}
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
