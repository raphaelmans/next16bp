"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PlaceFilters } from "./court-filters";

interface PlaceFiltersSheetProps {
  amenities?: string[];
  province?: string;
  city?: string;
  sportId?: string;
  verification?: "verified_reservable" | "curated" | "unverified_reservable";
  hasClearableFilters?: boolean;
  resetLocationHref?: string;
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

export function PlaceFiltersSheet({
  amenities,
  province,
  city,
  sportId,
  verification,
  hasClearableFilters,
  resetLocationHref,
  onAmenitiesChange,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onVerificationChange,
  onClearAll,
  className,
}: PlaceFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    return (
      (amenities?.length ?? 0) +
      (province ? 1 : 0) +
      (city ? 1 : 0) +
      (sportId ? 1 : 0) +
      (verification ? 1 : 0)
    );
  }, [amenities, province, city, sportId, verification]);

  const hasFilters = activeCount > 0;
  const canClearFilters = hasClearableFilters ?? hasFilters;

  const activeCountLabel = activeCount > 9 ? "9+" : String(activeCount);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open filters"
          className={cn("relative lg:hidden", className)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasFilters && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCountLabel}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 sm:h-[75vh] sm:rounded-t-xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="font-heading">Filters</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? `${activeCount} selected`
                : "Refine courts by location, amenities, and more."}
            </p>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <PlaceFilters
                layout="sheet"
                showClearButton={false}
                amenities={amenities}
                province={province}
                city={city}
                sportId={sportId}
                verification={verification}
                onAmenitiesChange={onAmenitiesChange}
                onProvinceChange={onProvinceChange}
                onCityChange={onCityChange}
                onSportChange={onSportChange}
                onVerificationChange={onVerificationChange}
                onClearAll={onClearAll}
              />
            </div>
          </ScrollArea>

          <div className="border-t bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!canClearFilters}
                onClick={onClearAll}
              >
                Clear all
              </Button>
              <SheetClose asChild>
                <Button type="button" className="flex-1">
                  Show results
                </Button>
              </SheetClose>
            </div>
            {resetLocationHref && (
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
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
