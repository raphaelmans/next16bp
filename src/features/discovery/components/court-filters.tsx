"use client";

import { Filter, X } from "lucide-react";
import { useEffect, useMemo } from "react";
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
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
import { trpc } from "@/trpc/client";

interface PlaceFiltersProps {
  province?: string;
  city?: string;
  sportId?: string;
  onProvinceChange: (province: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onClearAll: () => void;
  className?: string;
}

export function PlaceFilters({
  province,
  city,
  sportId,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onClearAll,
  className,
}: PlaceFiltersProps) {
  const hasFilters = province || city || sportId;
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;

  const provinceOptions = useMemo(() => {
    if (!provincesCities) return [];
    return Object.keys(provincesCities)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value }));
  }, [provincesCities]);

  const cityOptions = useMemo(() => {
    if (!provincesCities || !province) return [];

    const cities = provincesCities[province] ?? [];
    return cities.map((value) => ({ value, label: value }));
  }, [provincesCities, province]);

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "All provinces";

  const cityPlaceholder = !province
    ? "Select a province first"
    : provincesCitiesQuery.isLoading
      ? "Loading cities..."
      : "All cities";

  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || !province;

  const handleProvinceChange = (value: string) => {
    const nextProvince = value === "all" ? undefined : value;
    onProvinceChange(nextProvince);
    if (nextProvince !== province) {
      onCityChange(undefined);
    }
  };

  const handleCityChange = (value: string) => {
    onCityChange(value === "all" ? undefined : value);
  };

  useEffect(() => {
    if (!provincesCities) return;

    if (province && !Object.hasOwn(provincesCities, province)) {
      onProvinceChange(undefined);
      onCityChange(undefined);
      return;
    }

    if (!province && city) {
      const matchingEntry = Object.entries(provincesCities).find(([, cities]) =>
        cities.includes(city),
      );

      if (matchingEntry) {
        onProvinceChange(matchingEntry[0]);
      } else {
        onCityChange(undefined);
      }
      return;
    }

    if (province && city) {
      const availableCities = provincesCities[province] ?? [];
      if (!availableCities.includes(city)) {
        onCityChange(undefined);
      }
    }
  }, [city, province, provincesCities, onCityChange, onProvinceChange]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Province</Label>
        <Select
          value={province ?? "all"}
          onValueChange={handleProvinceChange}
          disabled={isProvinceDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={provincePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            {provinceOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Select
          value={province ? (city ?? "all") : ""}
          onValueChange={handleCityChange}
          disabled={isCityDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={cityPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cityOptions.map((item) => (
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
      <div
        className={cn("hidden lg:flex flex-wrap items-center gap-3", className)}
      >
        <Select
          value={province ?? "all"}
          onValueChange={handleProvinceChange}
          disabled={isProvinceDisabled}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            {provinceOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={province ? (city ?? "all") : ""}
          onValueChange={handleCityChange}
          disabled={isCityDisabled}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={cityPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cityOptions.map((item) => (
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
                {[province, city, sportId].filter(Boolean).length}
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
