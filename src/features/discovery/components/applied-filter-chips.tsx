"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const HOUR_LABELS: Record<string, string> = {};
for (let h = 0; h < 24; h++) {
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  HOUR_LABELS[`${String(h).padStart(2, "0")}:00`] =
    `${displayHour}:00 ${period}`;
}

const VERIFICATION_LABELS: Record<string, string> = {
  verified_reservable: "Verified",
  curated: "Curated",
  unverified_reservable: "Unverified",
};

interface AppliedFilterChipsProps {
  province?: string | null;
  city?: string | null;
  sportId?: string | null;
  date?: string | null;
  time?: string[] | null;
  amenities?: string[] | null;
  verification?:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable"
    | null;
  sports?: { id: string; name: string }[];
  onRemoveProvince: () => void;
  onRemoveCity: () => void;
  onRemoveSport: () => void;
  onRemoveDate: () => void;
  onRemoveTime: (hour: string) => void;
  onRemoveAmenity: (amenity: string) => void;
  onRemoveVerification: () => void;
}

export function AppliedFilterChips({
  province,
  city,
  sportId,
  date,
  time,
  amenities,
  verification,
  sports,
  onRemoveProvince,
  onRemoveCity,
  onRemoveSport,
  onRemoveDate,
  onRemoveTime,
  onRemoveAmenity,
  onRemoveVerification,
}: AppliedFilterChipsProps) {
  const { data: provincesCities } = usePHProvincesCitiesQuery();

  const provinceLabel = useMemo(() => {
    if (!province || !provincesCities) return province ?? undefined;
    const options = buildProvinceOptions(provincesCities);
    return options.find((o) => o.value === province)?.label ?? province;
  }, [province, provincesCities]);

  const cityLabel = useMemo(() => {
    if (!city || !provincesCities) return city ?? undefined;
    const prov = province
      ? findProvinceBySlug(provincesCities, province)
      : undefined;
    if (!prov) return city;
    const options = buildCityOptions(prov);
    return options.find((o) => o.value === city)?.label ?? city;
  }, [city, province, provincesCities]);

  const sportLabel = useMemo(() => {
    if (!sportId || !sports) return undefined;
    return sports.find((s) => s.id === sportId)?.name;
  }, [sportId, sports]);

  const dateLabel = useMemo(() => {
    if (!date) return undefined;
    const parsed = new Date(`${date}T12:00:00+08:00`);
    return Number.isNaN(parsed.getTime())
      ? date
      : format(parsed, "MMM d, yyyy");
  }, [date]);

  const hasChips =
    province ||
    city ||
    sportId ||
    date ||
    (time && time.length > 0) ||
    (amenities && amenities.length > 0) ||
    verification;

  if (!hasChips) return null;

  return (
    <ScrollArea className="w-full" type="scroll">
      <div className="flex items-center gap-1.5 pb-1">
        {province && (
          <FilterChip
            label={provinceLabel ?? province}
            onRemove={onRemoveProvince}
          />
        )}
        {city && (
          <FilterChip label={cityLabel ?? city} onRemove={onRemoveCity} />
        )}
        {sportId && sportLabel && (
          <FilterChip label={sportLabel} onRemove={onRemoveSport} />
        )}
        {date && dateLabel && (
          <FilterChip label={dateLabel} onRemove={onRemoveDate} />
        )}
        {time?.map((hour) => (
          <FilterChip
            key={hour}
            label={HOUR_LABELS[hour] ?? hour}
            onRemove={() => onRemoveTime(hour)}
          />
        ))}
        {verification && (
          <FilterChip
            label={VERIFICATION_LABELS[verification] ?? verification}
            onRemove={onRemoveVerification}
          />
        )}
        {amenities?.map((amenity) => (
          <FilterChip
            key={amenity}
            label={amenity}
            onRemove={() => onRemoveAmenity(amenity)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="shrink-0 gap-1 pr-1 text-xs font-normal"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
