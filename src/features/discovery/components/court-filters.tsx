"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAmenitiesQuery } from "@/common/clients/amenities-client";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface PlaceFiltersProps {
  amenities?: string[];
  province?: string;
  city?: string;
  sportId?: string;
  verification?: "verified_reservable" | "curated" | "unverified_reservable";
  layout?: "desktop" | "sheet";
  showClearButton?: boolean;
  onAmenitiesChange: (amenities: string[] | undefined) => void;
  onProvinceChange: (province: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onVerificationChange: (
    verification:
      | "verified_reservable"
      | "curated"
      | "unverified_reservable"
      | undefined,
  ) => void;
  onClearAll: () => void;
  className?: string;
}

export function PlaceFilters({
  amenities,
  province,
  city,
  sportId,
  verification,
  layout = "desktop",
  showClearButton = true,
  onAmenitiesChange,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onVerificationChange,
  onClearAll,
  className,
}: PlaceFiltersProps) {
  const isSheet = layout === "sheet";
  const hasFilters =
    (amenities && amenities.length > 0) ||
    province ||
    city ||
    sportId ||
    verification;
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

  const amenitiesTriggerClassName = cn(
    "justify-between",
    isSheet ? "w-full" : "w-56",
  );

  const provinceTriggerClassName = cn(
    "justify-between",
    isSheet ? "w-full" : "w-48",
  );

  const cityTriggerClassName = cn(
    "justify-between",
    isSheet ? "w-full" : "w-48",
  );

  const amenitiesPopoverClassName = cn(
    "p-0",
    isSheet ? "w-[var(--radix-popover-trigger-width)] z-[60]" : "w-56",
  );

  const provincePopoverClassName = cn(
    "p-0",
    isSheet ? "w-[var(--radix-popover-trigger-width)] z-[60]" : "w-48",
  );

  const cityPopoverClassName = cn(
    "p-0",
    isSheet ? "w-[var(--radix-popover-trigger-width)] z-[60]" : "w-48",
  );

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

  return (
    <div
      className={cn(
        isSheet
          ? "flex w-full flex-col gap-3"
          : "hidden lg:flex flex-wrap items-center gap-3",
        className,
      )}
    >
      <Popover open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={amenitiesOpen}
            disabled={isAmenitiesDisabled}
            className={amenitiesTriggerClassName}
          >
            <span className="truncate">{amenitiesTriggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={amenitiesPopoverClassName} align="start">
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
            className={provinceTriggerClassName}
          >
            {provinceTriggerLabel ?? provincePlaceholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={provincePopoverClassName} align="start">
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
            className={cityTriggerClassName}
          >
            {cityTriggerLabel ?? cityPlaceholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cityPopoverClassName} align="start">
          <Command>
            <CommandInput
              placeholder={province ? "Search cities..." : "Select a province"}
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
        value={sportId ?? "all"}
        onValueChange={(value) =>
          onSportChange(value === "all" ? undefined : value)
        }
        disabled={sportsLoading}
      >
        <SelectTrigger className={isSheet ? "w-full" : undefined}>
          <SelectValue placeholder="All sports" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sports</SelectItem>
          {sports.map((sport) => (
            <SelectItem key={sport.id} value={sport.id}>
              {sport.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        value={verification}
        onValueChange={(value) =>
          onVerificationChange(
            value
              ? (value as
                  | "verified_reservable"
                  | "curated"
                  | "unverified_reservable")
              : undefined,
          )
        }
        variant="outline"
        size="sm"
        className={isSheet ? "grid w-full grid-cols-3" : undefined}
      >
        <ToggleGroupItem
          value="verified_reservable"
          className={isSheet ? "w-full justify-center text-xs" : undefined}
        >
          Verified
        </ToggleGroupItem>
        <ToggleGroupItem
          value="curated"
          className={isSheet ? "w-full justify-center text-xs" : undefined}
        >
          Curated
        </ToggleGroupItem>
        <ToggleGroupItem
          value="unverified_reservable"
          className={isSheet ? "w-full justify-center text-xs" : undefined}
        >
          Unverified
        </ToggleGroupItem>
      </ToggleGroup>

      {showClearButton && hasFilters && (
        <Button variant="ghost" className="w-full" onClick={onClearAll}>
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
