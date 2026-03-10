"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PlaceFilters } from "./court-filters";
import { DiscoverySearchField } from "./discovery-search-field";

interface PlaceFiltersSheetProps {
  q?: string;
  amenities?: string[];
  province?: string;
  city?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  verification?: "verified_reservable" | "curated" | "unverified_reservable";
  hasClearableFilters?: boolean;
  resetLocationHref?: string;
  onQueryChange: (query: string) => void;
  onQuerySubmit: () => void;
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

export function PlaceFiltersSheet({
  q,
  amenities,
  province,
  city,
  sportId,
  date,
  time,
  verification,
  hasClearableFilters,
  resetLocationHref,
  onQueryChange,
  onQuerySubmit,
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
}: PlaceFiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

  const activeCount = useMemo(() => {
    return (
      (amenities?.length ?? 0) +
      (province ? 1 : 0) +
      (city ? 1 : 0) +
      (sportId ? 1 : 0) +
      (date ? 1 : 0) +
      (time?.length ?? 0) +
      (verification ? 1 : 0)
    );
  }, [amenities, province, city, sportId, date, time, verification]);

  const hasFilters = activeCount > 0;
  const canClearFilters = hasClearableFilters ?? hasFilters;

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Open filters"
          className={cn(
            "relative gap-2 rounded-xl border-border/60 bg-background/95 px-4 shadow-sm lg:hidden",
            className,
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {hasFilters && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 sm:h-[75vh] sm:rounded-t-xl"
      >
        <div ref={sheetContentRef} className="flex h-full flex-col">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="font-heading text-base">Filters</SheetTitle>
          </SheetHeader>

          <div className="border-b px-4 py-3">
            <DiscoverySearchField
              value={q ?? ""}
              onValueChange={onQueryChange}
              onSubmit={onQuerySubmit}
              className="w-full"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <PlaceFilters
                layout="sheet"
                showClearButton={false}
                amenities={amenities}
                comboboxPortalContainer={sheetContentRef}
                province={province}
                city={city}
                sportId={sportId}
                date={date}
                time={time}
                verification={verification}
                onAmenitiesChange={onAmenitiesChange}
                onProvinceChange={onProvinceChange}
                onCityChange={onCityChange}
                onSportChange={onSportChange}
                onDateChange={onDateChange}
                onTimeChange={onTimeChange}
                onVerificationChange={onVerificationChange}
                onClearAll={onClearAll}
              />
            </div>
          </ScrollArea>

          <div className="border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!canClearFilters}
                onClick={onClearAll}
              >
                Clear all
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={handleApply}
              >
                Show results
              </Button>
            </div>
            {resetLocationHref && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 w-full text-xs"
                asChild
              >
                <Link href={resetLocationHref}>Reset location</Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
