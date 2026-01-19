"use client";

import { Check, ChevronsUpDown, Filter, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useAmenitiesQuery } from "@/shared/lib/clients/amenities-client";
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/shared/lib/ph-location-data";
import { trpc } from "@/trpc/client";

interface PlaceFiltersProps {
  amenities?: string[];
  province?: string;
  city?: string;
  sportId?: string;
  onAmenitiesChange: (amenities: string[] | undefined) => void;
  onProvinceChange: (province: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onClearAll: () => void;
  className?: string;
}

export function PlaceFilters({
  amenities,
  province,
  city,
  sportId,
  onAmenitiesChange,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onClearAll,
  className,
}: PlaceFiltersProps) {
  const hasFilters =
    (amenities && amenities.length > 0) || province || city || sportId;
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});
  const amenitiesQuery = useAmenitiesQuery();
  const amenitiesList = amenitiesQuery.data ?? [];
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;
  const selectedProvince = useMemo(
    () =>
      provincesCities
        ? findProvinceBySlug(provincesCities, province)
        : undefined,
    [province, provincesCities],
  );

  type LocationOption = { label: string; value: string };

  const amenitiesOptions = useMemo(
    () =>
      amenitiesList
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .sort((a, b) => a.localeCompare(b)),
    [amenitiesList],
  );

  const selectedAmenities = useMemo(
    () => (amenities ?? []).filter((item) => amenitiesOptions.includes(item)),
    [amenities, amenitiesOptions],
  );

  useEffect(() => {
    if (!amenities || amenities.length === 0 || amenitiesOptions.length === 0) {
      return;
    }

    const next = Array.from(
      new Set(amenities.filter((item) => amenitiesOptions.includes(item))),
    );

    if (next.length !== amenities.length) {
      onAmenitiesChange(
        next.length > 0 ? next.sort((a, b) => a.localeCompare(b)) : undefined,
      );
    }
  }, [amenities, amenitiesOptions, onAmenitiesChange]);

  const provinceOptions = useMemo<LocationOption[]>(() => {
    if (!provincesCities) return [];
    return buildProvinceOptions(provincesCities);
  }, [provincesCities]);

  const cityOptions = useMemo<LocationOption[]>(() => {
    if (!provincesCities || !selectedProvince) return [];
    return buildCityOptions(selectedProvince);
  }, [provincesCities, selectedProvince]);

  const amenitiesPlaceholder = amenitiesQuery.isLoading
    ? "Loading amenities..."
    : "All amenities";

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "All provinces";

  const cityPlaceholder = !province
    ? "Select a province first"
    : provincesCitiesQuery.isLoading
      ? "Loading cities..."
      : "All cities";

  const amenitiesTriggerLabel =
    selectedAmenities.length > 0
      ? `${selectedAmenities.length} ${
          selectedAmenities.length === 1 ? "amenity" : "amenities"
        }`
      : amenitiesPlaceholder;
  const provinceTriggerLabel = provinceOptions.find(
    (item: LocationOption) => item.value === province,
  )?.label;
  const cityTriggerLabel = cityOptions.find(
    (item: LocationOption) => item.value === city,
  )?.label;

  const isAmenitiesDisabled = amenitiesQuery.isLoading;
  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || !province;

  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const handleAmenitiesChange = (amenity: string) => {
    const current = new Set(selectedAmenities);
    if (current.has(amenity)) {
      current.delete(amenity);
    } else {
      current.add(amenity);
    }
    const next = Array.from(current).sort((a, b) => a.localeCompare(b));
    onAmenitiesChange(next.length > 0 ? next : undefined);
  };

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

    if (province && !selectedProvince) {
      onProvinceChange(undefined);
      onCityChange(undefined);
      return;
    }

    if (!province && city) {
      const match = findCityBySlugAcrossProvinces(provincesCities, city);
      if (match) {
        onProvinceChange(match.province.slug);
      } else {
        onCityChange(undefined);
      }
      return;
    }

    if (province && city) {
      const selectedCity = findCityBySlug(selectedProvince, city);
      if (!selectedCity) {
        onCityChange(undefined);
      }
    }
  }, [
    city,
    province,
    provincesCities,
    selectedProvince,
    onCityChange,
    onProvinceChange,
  ]);

  useEffect(() => {
    if (!province) {
      setCityOpen(false);
    }
  }, [province]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Amenities</Label>
        <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={amenitiesOpen}
              disabled={isAmenitiesDisabled}
              className="w-full justify-between"
            >
              <span className="truncate">{amenitiesTriggerLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search amenities..." />
              <CommandList>
                <CommandEmpty>No amenities found.</CommandEmpty>
                <CommandGroup>
                  {amenitiesOptions.map((amenity) => (
                    <CommandItem
                      key={amenity}
                      value={amenity}
                      onSelect={(value) => {
                        handleAmenitiesChange(value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAmenities.includes(amenity)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {amenity}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedAmenities.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2"
            onClick={() => onAmenitiesChange(undefined)}
          >
            <X className="h-4 w-4 mr-2" />
            Clear amenities
          </Button>
        )}
      </div>

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
        <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={amenitiesOpen}
              disabled={isAmenitiesDisabled}
              className="w-56 justify-between"
            >
              <span className="truncate">{amenitiesTriggerLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search amenities..." />
              <CommandList>
                <CommandEmpty>No amenities found.</CommandEmpty>
                <CommandGroup>
                  {amenitiesOptions.map((amenity) => (
                    <CommandItem
                      key={amenity}
                      value={amenity}
                      onSelect={(value) => {
                        handleAmenitiesChange(value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAmenities.includes(amenity)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {amenity}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={provinceOpen}
              disabled={isProvinceDisabled}
              className="w-48 justify-between"
            >
              {provinceTriggerLabel ?? provincePlaceholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search provinces..." />
              <CommandList>
                <CommandEmpty>No province found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      handleProvinceChange("all");
                      setProvinceOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        province ? "opacity-0" : "opacity-100",
                      )}
                    />
                    All provinces
                  </CommandItem>
                  {provinceOptions.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(value) => {
                        handleProvinceChange(value);
                        setProvinceOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          province === item.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              disabled={isCityDisabled}
              className="w-48 justify-between"
            >
              {cityTriggerLabel ?? cityPlaceholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <Command>
              <CommandInput
                placeholder={
                  province ? "Search cities..." : "Select a province"
                }
                disabled={!province}
              />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      handleCityChange("all");
                      setCityOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        city ? "opacity-0" : "opacity-100",
                      )}
                    />
                    All cities
                  </CommandItem>
                  {cityOptions.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(value) => {
                        handleCityChange(value);
                        setCityOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          city === item.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
                {
                  [province, city, sportId, ...(amenities ?? [])].filter(
                    Boolean,
                  ).length
                }
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
