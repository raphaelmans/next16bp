"use client";

import { addMinutes } from "date-fns";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import * as React from "react";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/common/format";
import { getZonedDayKey } from "@/common/time-zone";
import {
  MobileWeekGrid,
  MobileWeekGridSkeleton,
  type TimeSlot,
  WeekNavigator,
} from "@/components/kudos";
import { Button } from "@/components/ui/button";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";
import { cn } from "@/lib/utils";

type PlaceSportOption = {
  id: string;
  name: string;
};

type PlaceCourtOption = {
  id: string;
  label: string;
};

type TimeRangeSelection = {
  startTime: string;
  durationMinutes: number;
};

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailMobileSheetProps = {
  showBooking: boolean;
  mobileSheetExpanded: boolean;
  setMobileSheetExpanded: (open: boolean) => void;
  sports: PlaceSportOption[];
  selectedSportId?: string;
  onMobileSportChange: (sportId: string) => void;
  courtsForSport: PlaceCourtOption[];
  selectionMode: "any" | "court";
  selectedCourtId?: string;
  onMobileCourtChange: (courtId: string | undefined) => void;
  selectedDate?: Date;
  placeTimeZone: string;
  onCalendarJump: (date: Date | undefined) => void;
  todayRangeStart: Date;
  maxBookingDate: Date;
  isMobileRefreshing: boolean;
  isMobileLoading: boolean;
  weekDayKeys: string[];
  weekSlotsByDay: Map<string, TimeSlot[]>;
  todayDayKey: string;
  maxDayKey: string;
  selectedRange?: TimeRangeSelection;
  onAnyRangeChange: (range: TimeRangeSelection) => void;
  onCourtRangeChange: (range: TimeRangeSelection) => void;
  onClearSelection: () => void;
  onReserve: () => void;
  onContinueFromCart: () => void;
  onBackToSelect: () => void;
  hasSelection: boolean;
  selectionSummary: SelectionSummary | null;
  selectionDateLabel: string;
  selectionTimeLabel: string;
  cartItems: BookingCartItem[];
  canAddToCart: boolean;
  onAddToCartAction: () => void;
  onRemoveFromCartAction: (key: string) => void;
  cartedStartTimes?: Set<string>;
  weekHeaderLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isPrevWeekDisabled: boolean;
  isNextWeekDisabled: boolean;
  onGoToToday: () => void;
};

export function PlaceDetailMobileSheet({
  showBooking,
  mobileSheetExpanded,
  setMobileSheetExpanded,
  sports,
  selectedSportId,
  onMobileSportChange,
  courtsForSport,
  selectionMode,
  selectedCourtId,
  onMobileCourtChange,
  selectedDate,
  placeTimeZone,
  onCalendarJump,
  todayRangeStart,
  maxBookingDate,
  isMobileRefreshing,
  isMobileLoading,
  weekDayKeys,
  weekSlotsByDay,
  todayDayKey,
  maxDayKey,
  selectedRange,
  onAnyRangeChange,
  onCourtRangeChange,
  onClearSelection,
  onReserve,
  onContinueFromCart,
  onBackToSelect,
  hasSelection,
  selectionSummary,
  selectionDateLabel,
  selectionTimeLabel,
  cartItems,
  canAddToCart,
  onAddToCartAction,
  onRemoveFromCartAction,
  cartedStartTimes,
  weekHeaderLabel,
  onPrevWeek,
  onNextWeek,
  isPrevWeekDisabled,
  isNextWeekDisabled,
  onGoToToday,
}: PlaceDetailMobileSheetProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const cartItemCount = cartItems.length;
  const hasCartItems = cartItemCount > 0;
  const [mobileFlowStep, setMobileFlowStep] = React.useState<
    "select" | "review"
  >("select");

  React.useEffect(() => {
    // Use rAF to ensure DOM has updated after the week change re-render
    const id = requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [weekHeaderLabel]);
  const isReviewStep = mobileFlowStep === "review" && hasCartItems;

  const pricedItemCount = cartItems.filter(
    (item) => item.estimatedPriceCents !== null,
  ).length;
  const unpricedItemCount = cartItemCount - pricedItemCount;
  const hasEstimatedTotal = pricedItemCount > 0;
  const hasPartialEstimate = unpricedItemCount > 0;
  const estimatedTotalCents = cartItems.reduce(
    (sum, item) => sum + (item.estimatedPriceCents ?? 0),
    0,
  );
  const cartCurrency =
    cartItems[0]?.currency ?? selectionSummary?.currency ?? "PHP";

  React.useEffect(() => {
    if (!mobileSheetExpanded) {
      setMobileFlowStep("select");
    }
  }, [mobileSheetExpanded]);

  React.useEffect(() => {
    if (!hasCartItems && mobileFlowStep === "review") {
      onBackToSelect();
      setMobileFlowStep("select");
    }
  }, [hasCartItems, mobileFlowStep, onBackToSelect]);

  const handleAddToBooking = React.useCallback(() => {
    onAddToCartAction();
    setMobileFlowStep("review");
  }, [onAddToCartAction]);

  const handleOpenReview = React.useCallback(() => {
    if (!hasCartItems) return;
    setMobileFlowStep("review");
  }, [hasCartItems]);

  if (!showBooking) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:hidden">
      <button
        type="button"
        className="flex w-full flex-col items-center pt-3 pb-2"
        onClick={() => setMobileSheetExpanded(!mobileSheetExpanded)}
      >
        <div className="h-1 w-9 rounded-full bg-muted-foreground/30" />
        <div className="mt-1.5 flex items-center gap-1.5">
          <p className="text-base font-semibold">Check Availability</p>
          {mobileSheetExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {mobileSheetExpanded && (
        <>
          <div className="px-5 pb-3">
            <p className="text-xs font-medium text-muted-foreground">
              {isReviewStep
                ? "Step 2 of 2 · Review booking"
                : "Step 1 of 2 · Select slots"}
            </p>
          </div>

          {isReviewStep ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">
                  Courts in booking ({cartItemCount})
                </p>
                {cartItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.courtLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const endTime = addMinutes(
                            new Date(item.startTime),
                            item.durationMinutes,
                          );
                          const crossesMidnight =
                            getZonedDayKey(item.startTime, placeTimeZone) !==
                            getZonedDayKey(endTime, placeTimeZone);
                          return (
                            <>
                              {formatInTimeZone(
                                new Date(item.startTime),
                                placeTimeZone,
                                "MMM d, h:mm a",
                              )}
                              {` - ${formatInTimeZone(endTime, placeTimeZone, crossesMidnight ? "MMM d, h:mm a" : "h:mm a")}`}{" "}
                              · {formatDuration(item.durationMinutes)}
                              {item.estimatedPriceCents !== null
                                ? ` · ${formatCurrency(item.estimatedPriceCents, item.currency)}`
                                : " · Price unavailable"}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFromCartAction(item.key)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Remove ${item.courtLabel}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {hasEstimatedTotal && (
                  <div className="flex items-center justify-between border-t pt-2 text-sm">
                    <p className="text-muted-foreground">
                      {hasPartialEstimate
                        ? "Partial estimate"
                        : "Estimated total"}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(estimatedTotalCents, cartCurrency)}
                    </p>
                  </div>
                )}
                {hasPartialEstimate && (
                  <p className="text-xs text-muted-foreground">
                    {unpricedItemCount} court
                    {unpricedItemCount === 1 ? "" : "s"} pending price estimate.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {sports.length > 1 && (
                <div className="scrollbar-none flex gap-2 overflow-x-auto px-5 pb-3">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => onMobileSportChange(sport.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        selectedSportId === sport.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-muted/50",
                      )}
                    >
                      {sport.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-5 pb-3">
                <div className="scrollbar-none flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => onMobileCourtChange(undefined)}
                    className={cn(
                      "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                      selectionMode === "any"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-accent/30 hover:bg-accent/10",
                    )}
                  >
                    Any court
                  </button>
                  {courtsForSport.map((court) => (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => onMobileCourtChange(court.id)}
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                        selectionMode === "court" &&
                          selectedCourtId === court.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-accent/30 hover:bg-accent/10",
                      )}
                    >
                      {court.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-3">
                <WeekNavigator
                  weekHeaderLabel={weekHeaderLabel}
                  onPrevWeek={onPrevWeek}
                  onNextWeek={onNextWeek}
                  isPrevWeekDisabled={isPrevWeekDisabled}
                  isNextWeekDisabled={isNextWeekDisabled}
                  onGoToToday={onGoToToday}
                  selectedDate={selectedDate}
                  onCalendarJump={onCalendarJump}
                  todayRangeStart={todayRangeStart}
                  maxBookingDate={maxBookingDate}
                  placeTimeZone={placeTimeZone}
                />
              </div>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto px-5 pb-2"
              >
                {isMobileRefreshing && (
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating availability...
                  </div>
                )}
                {isMobileLoading ? (
                  <MobileWeekGridSkeleton />
                ) : (
                  <MobileWeekGrid
                    dayKeys={weekDayKeys}
                    slotsByDay={weekSlotsByDay}
                    timeZone={placeTimeZone}
                    selectedRange={selectedRange}
                    onRangeChange={
                      selectionMode === "any"
                        ? onAnyRangeChange
                        : onCourtRangeChange
                    }
                    onClear={onClearSelection}
                    todayDayKey={todayDayKey}
                    maxDayKey={maxDayKey}
                    cartedStartTimes={cartedStartTimes}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      <div className="flex items-center justify-between border-t border-border bg-background px-5 py-4">
        <div className="min-w-0">
          {isReviewStep ? (
            <p className="text-sm text-muted-foreground">
              {cartItemCount} court{cartItemCount !== 1 ? "s" : ""} in booking
            </p>
          ) : hasSelection && selectionSummary ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectionDateLabel}
                {selectionTimeLabel ? ` · ${selectionTimeLabel}` : ""}
              </p>
              {selectionSummary.totalCents !== undefined && (
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(
                    selectionSummary.totalCents,
                    selectionSummary.currency,
                  )}
                </p>
              )}
            </>
          ) : cartItemCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {cartItemCount} court{cartItemCount !== 1 ? "s" : ""} in booking
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a time slot</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {isReviewStep ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onBackToSelect();
                setMobileFlowStep("select");
              }}
            >
              Back to slot selection
            </Button>
          ) : null}

          {canAddToCart && !isReviewStep ? (
            <Button onClick={handleAddToBooking}>Add to booking</Button>
          ) : hasCartItems && !isReviewStep ? (
            <Button onClick={handleOpenReview}>
              Review booking ({cartItemCount})
            </Button>
          ) : isReviewStep ? (
            <Button onClick={onContinueFromCart}>
              Continue to review page
            </Button>
          ) : (
            <Button disabled={!hasSelection} onClick={onReserve}>
              Reserve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
