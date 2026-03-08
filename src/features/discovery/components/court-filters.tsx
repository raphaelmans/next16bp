"use client";

import {
  Check,
  ChevronsUpDown,
  Clock,
  MapPin,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAmenityDisplayLabel,
  getAmenityKey,
  mergeAmenityOptions,
} from "@/common/amenities";
import { useAmenitiesQuery } from "@/common/clients/amenities-client";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { getZonedDayKey } from "@/common/time-zone";
import { KudosDatePicker } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQueryDiscoverySports } from "@/features/discovery/hooks";
import { cn } from "@/lib/utils";

// 24 hours starting at 6 AM, wrapping around
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const hour = (index + 6) % 24;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const value = `${String(hour).padStart(2, "0")}:00`;

  return {
    value,
    label: `${displayHour}:00 ${period}`,
  };
});

const HOUR_VALUES = HOUR_OPTIONS.map((o) => o.value);
const HOUR_LABEL_MAP = new Map(HOUR_OPTIONS.map((o) => [o.value, o.label]));

export interface PlaceFiltersProps {
  amenities?: string[];
  province?: string;
  city?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  verification?: "verified_reservable" | "curated" | "unverified_reservable";
  layout?: "desktop" | "sheet";
  showClearButton?: boolean;
  hasClearableFilters?: boolean;
  resetLocationHref?: string;
  onAmenitiesChange: (amenities: string[] | undefined) => void;
  onProvinceChange: (province: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onDateChange: (date: string | undefined) => void;
  onTimeChange: (time: string[] | undefined) => void;
  onVerificationChange: (
    verification:
      | "verified_reservable"
      | "curated"
      | "unverified_reservable"
      | undefined,
  ) => void;
  onClearAll: () => void;
  onApply?: () => void;
  className?: string;
}

export function PlaceFilters({
  amenities,
  province,
  city,
  sportId,
  date,
  time,
  verification,
  layout = "desktop",
  showClearButton = true,
  hasClearableFilters,
  resetLocationHref,
  onAmenitiesChange,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onDateChange,
  onTimeChange,
  onVerificationChange,
  onClearAll,
  onApply,
  className,
}: PlaceFiltersProps) {
  const isSheet = layout === "sheet";
  const hasFilters =
    (amenities && amenities.length > 0) ||
    province ||
    city ||
    sportId ||
    date ||
    time ||
    verification;
  const canClearFilters = hasClearableFilters ?? Boolean(hasFilters);
  const { data: sports = [], isLoading: sportsLoading } =
    useQueryDiscoverySports();
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
    () => mergeAmenityOptions(amenitiesList),
    [amenitiesList],
  );
  const amenitiesOptionMap = useMemo(
    () =>
      new Map(
        amenitiesOptions.map((amenity) => [getAmenityKey(amenity), amenity]),
      ),
    [amenitiesOptions],
  );

  const selectedAmenities = useMemo(
    () =>
      Array.from(
        new Set(
          (amenities ?? [])
            .map((amenity) => amenitiesOptionMap.get(getAmenityKey(amenity)))
            .filter((amenity): amenity is string => Boolean(amenity)),
        ),
      ),
    [amenities, amenitiesOptionMap],
  );

  useEffect(() => {
    if (!amenities || amenities.length === 0 || amenitiesOptions.length === 0) {
      return;
    }

    const next = Array.from(
      new Set(
        amenities
          .map((amenity) => amenitiesOptionMap.get(getAmenityKey(amenity)))
          .filter((amenity): amenity is string => Boolean(amenity)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const currentKeys = new Set(
      amenities.map((amenity) => getAmenityKey(amenity)),
    );
    const nextKeys = new Set(next.map((amenity) => getAmenityKey(amenity)));
    const hasChanged =
      currentKeys.size !== nextKeys.size ||
      Array.from(currentKeys).some((key) => !nextKeys.has(key));

    if (hasChanged) {
      onAmenitiesChange(next.length > 0 ? next : undefined);
    }
  }, [
    amenities,
    amenitiesOptionMap,
    amenitiesOptions.length,
    onAmenitiesChange,
  ]);

  const provinceOptions = useMemo<LocationOption[]>(() => {
    if (!provincesCities) return [];
    return buildProvinceOptions(provincesCities);
  }, [provincesCities]);

  const cityOptions = useMemo<LocationOption[]>(() => {
    if (!provincesCities || !selectedProvince) return [];
    return buildCityOptions(selectedProvince);
  }, [provincesCities, selectedProvince]);

  const amenitiesPlaceholder = amenitiesQuery.isLoading
    ? "Amenities..."
    : "Select amenities";

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Province..."
    : "Province";

  const cityPlaceholder = !province
    ? "City"
    : provincesCitiesQuery.isLoading
      ? "City..."
      : "City";

  const provinceTriggerLabel = provinceOptions.find(
    (item: LocationOption) => item.value === province,
  )?.label;
  const cityTriggerLabel = cityOptions.find(
    (item: LocationOption) => item.value === city,
  )?.label;

  const isAmenitiesDisabled = amenitiesQuery.isLoading;
  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || !province;
  const selectedDate = useMemo(() => {
    if (!date) return undefined;
    const parsed = new Date(`${date}T12:00:00+08:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [date]);
  const isTimeEnabled = Boolean(date);

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const selectedTimes = time ?? [];
  const amenitiesAnchorRef = useRef<HTMLDivElement | null>(null);
  const timeAnchorRef = useRef<HTMLDivElement | null>(null);

  const comboTriggerClassName = cn(
    "justify-between text-sm",
    isSheet ? "w-full" : "w-auto min-w-[140px]",
  );

  const comboPopoverClassName = cn(
    "p-0",
    isSheet ? "w-[var(--radix-popover-trigger-width)] z-[60]" : "w-56",
  );

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

  const handleDateChange = (nextDate: Date | undefined) => {
    onDateChange(
      nextDate ? getZonedDayKey(nextDate, "Asia/Manila") : undefined,
    );
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

  const handleTimeChange = (values: string[]) => {
    onTimeChange(values.length > 0 ? values : undefined);
  };

  // ── Shared sub-components ──

  const provinceCombobox = (
    <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={provinceOpen}
          disabled={isProvinceDisabled}
          className={comboTriggerClassName}
        >
          <MapPin className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {provinceTriggerLabel ?? provincePlaceholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={comboPopoverClassName} align="start">
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
  );

  const cityCombobox = (
    <Popover open={cityOpen} onOpenChange={setCityOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={cityOpen}
          disabled={isCityDisabled}
          className={comboTriggerClassName}
        >
          {cityTriggerLabel ?? cityPlaceholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={comboPopoverClassName} align="start">
        <Command>
          <CommandInput
            placeholder={
              province ? "Search cities..." : "Select a province first"
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
  );

  const sportSelect = (
    <Select
      value={sportId ?? "all"}
      onValueChange={(value) =>
        onSportChange(value === "all" ? undefined : value)
      }
      disabled={sportsLoading}
    >
      <SelectTrigger
        className={cn("text-sm", isSheet ? "w-full" : "w-auto min-w-[130px]")}
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Sport" />
        </div>
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
  );

  const datePicker = (
    <KudosDatePicker
      value={selectedDate}
      onChange={handleDateChange}
      placeholder="Date"
      className={cn(
        "bg-background text-sm",
        isSheet ? "w-full" : "w-auto min-w-[150px]",
      )}
      timeZone="Asia/Manila"
    />
  );

  const timeCombobox = (
    <div
      ref={timeAnchorRef}
      className={cn(isSheet ? "w-full" : "w-auto min-w-[180px]")}
    >
      <Combobox
        items={HOUR_VALUES}
        multiple
        value={selectedTimes}
        onValueChange={handleTimeChange}
        disabled={!isTimeEnabled}
      >
        <ComboboxChips
          className={cn(
            "min-h-9 text-sm",
            !isTimeEnabled && "pointer-events-none opacity-50",
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <ComboboxValue>
            {selectedTimes.map((val) => (
              <ComboboxChip key={val}>
                {HOUR_LABEL_MAP.get(val) ?? val}
              </ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput
            placeholder={
              selectedTimes.length > 0
                ? ""
                : isTimeEnabled
                  ? "Any hour"
                  : "Hour"
            }
          />
        </ComboboxChips>
        <ComboboxContent anchor={timeAnchorRef}>
          <ComboboxEmpty>No hours found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {HOUR_LABEL_MAP.get(item) ?? item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );

  const verificationToggles = (
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
      className={cn("w-full", isSheet && "grid grid-cols-3")}
    >
      <ToggleGroupItem
        value="verified_reservable"
        className={cn("text-xs", isSheet && "w-full justify-center")}
      >
        Verified
      </ToggleGroupItem>
      <ToggleGroupItem
        value="curated"
        className={cn("text-xs", isSheet && "w-full justify-center")}
      >
        Curated
      </ToggleGroupItem>
      <ToggleGroupItem
        value="unverified_reservable"
        className={cn("text-xs", isSheet && "w-full justify-center")}
      >
        Unverified
      </ToggleGroupItem>
    </ToggleGroup>
  );

  const amenitiesCombobox = (
    <div ref={amenitiesAnchorRef} className="w-full">
      <Combobox
        items={amenitiesOptions}
        multiple
        value={selectedAmenities}
        onValueChange={(nextValues) => {
          const next = Array.from(new Set(nextValues)).sort((a, b) =>
            a.localeCompare(b),
          );
          onAmenitiesChange(next.length > 0 ? next : undefined);
        }}
        disabled={isAmenitiesDisabled}
      >
        <ComboboxChips
          className={cn(
            "min-h-9 text-sm",
            isAmenitiesDisabled && "pointer-events-none opacity-50",
          )}
        >
          <ComboboxValue>
            {selectedAmenities.map((amenity) => (
              <ComboboxChip key={amenity}>
                {getAmenityDisplayLabel(amenity)}
              </ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput
            placeholder={
              selectedAmenities.length > 0 ? "" : amenitiesPlaceholder
            }
          />
        </ComboboxChips>
        <ComboboxContent anchor={amenitiesAnchorRef}>
          <ComboboxEmpty>No amenities found.</ComboboxEmpty>
          <ComboboxList>
            {(amenity) => (
              <ComboboxItem key={amenity} value={amenity}>
                {getAmenityDisplayLabel(amenity)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );

  // ── Sheet layout ──
  if (isSheet) {
    return (
      <div className={cn("flex w-full flex-col gap-4", className)}>
        {/* Location */}
        <fieldset className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Location
          </Label>
          {provinceCombobox}
          {cityCombobox}
        </fieldset>

        {/* Date & Time */}
        <fieldset className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Date & Time
          </Label>
          {datePicker}
          {timeCombobox}
        </fieldset>

        {/* Sport */}
        <fieldset className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sport
          </Label>
          {sportSelect}
        </fieldset>

        {/* Quality */}
        <fieldset className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Listing quality
          </Label>
          {verificationToggles}
        </fieldset>

        {/* Amenities */}
        <fieldset className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Amenities
          </Label>
          {amenitiesCombobox}
        </fieldset>
      </div>
    );
  }

  // ── Desktop: single-row filter bar ──
  return (
    <div
      className={cn(
        "hidden flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 lg:flex",
        className,
      )}
    >
      {/* Row 1: Primary — location, date, sport, time */}
      <div className="flex items-center gap-3 flex-wrap">
        {provinceCombobox}
        {cityCombobox}

        <div className="h-8 w-px bg-border" />

        {datePicker}
        {sportSelect}
        {timeCombobox}

        <div className="h-8 w-px bg-border" />

        {/* More: Quality + Amenities */}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-sm">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              More
              {((amenities && amenities.length > 0) || verification) && (
                <span className="ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                  {(amenities?.length ?? 0) + (verification ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Listing quality
              </Label>
              {verificationToggles}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amenities
              </Label>
              {amenitiesCombobox}
            </div>
          </PopoverContent>
        </Popover>

        {/* Apply */}
        {onApply && (
          <Button size="sm" onClick={onApply}>
            Apply
          </Button>
        )}

        {/* Clear + Reset */}
        {(showClearButton && canClearFilters) || resetLocationHref ? (
          <div className="ml-auto flex items-center gap-2">
            {showClearButton && canClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-muted-foreground"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
            {resetLocationHref && (
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href={resetLocationHref}>Reset location</Link>
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
