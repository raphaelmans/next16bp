"use client";

import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatCurrency, formatInTimeZone } from "@/common/format";
import {
  TimeRangePicker,
  TimeRangePickerSkeleton,
  type TimeSlot,
} from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileDateStrip } from "@/features/discovery/components";
import { canCheckoutBookingCart } from "@/features/discovery/place-detail/helpers/booking-cart-cta";
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
  today: Date;
  placeTimeZone: string;
  onMobileDateSelect: (date: Date) => void;
  mobileCalendarOpen: boolean;
  setMobileCalendarOpen: (open: boolean) => void;
  onMobileCalendarJump: (date: Date | undefined) => void;
  todayRangeStart: Date;
  maxBookingDate: Date;
  isMobileRefreshing: boolean;
  isMobileLoading: boolean;
  mobileDaySlots: TimeSlot[];
  selectedRange?: TimeRangeSelection;
  onAnyRangeChange: (range: TimeRangeSelection) => void;
  onCourtRangeChange: (range: TimeRangeSelection) => void;
  onClearSelection: () => void;
  onReserve: () => void;
  hasSelection: boolean;
  selectionSummary: SelectionSummary | null;
  selectionDateLabel: string;
  selectionTimeLabel: string;
  cartItemCount: number;
  canAddToCart: boolean;
  onAddToCartAction: () => void;
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
  today,
  placeTimeZone,
  onMobileDateSelect,
  mobileCalendarOpen,
  setMobileCalendarOpen,
  onMobileCalendarJump,
  todayRangeStart,
  maxBookingDate,
  isMobileRefreshing,
  isMobileLoading,
  mobileDaySlots,
  selectedRange,
  onAnyRangeChange,
  onCourtRangeChange,
  onClearSelection,
  onReserve,
  hasSelection,
  selectionSummary,
  selectionDateLabel,
  selectionTimeLabel,
  cartItemCount,
  canAddToCart,
  onAddToCartAction,
}: PlaceDetailMobileSheetProps) {
  if (!showBooking) {
    return null;
  }

  const canCheckoutFromCart = canCheckoutBookingCart({
    cartItemCount,
    hasSelection,
  });

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
                    selectionMode === "court" && selectedCourtId === court.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-accent/30 hover:bg-accent/10",
                  )}
                >
                  {court.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 px-5 pb-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setMobileCalendarOpen(true)}
            >
              <Calendar className="h-3.5 w-3.5" />
              {selectedDate
                ? formatInTimeZone(selectedDate, placeTimeZone, "EEEE, MMM d")
                : "Pick a date"}
            </Button>
            <MobileDateStrip
              selectedDate={selectedDate ?? today}
              onDateSelect={onMobileDateSelect}
              timeZone={placeTimeZone}
              todayDate={today}
            />
          </div>

          <Dialog
            open={mobileCalendarOpen}
            onOpenChange={setMobileCalendarOpen}
          >
            <DialogContent className="p-0 sm:max-w-fit">
              <DialogHeader className="sr-only">
                <DialogTitle>Select a date</DialogTitle>
                <DialogDescription>
                  Choose a date to view availability
                </DialogDescription>
              </DialogHeader>
              <CalendarWidget
                mode="single"
                selected={selectedDate}
                onSelect={onMobileCalendarJump}
                disabled={(date) => {
                  if (date < todayRangeStart) return true;
                  if (date > maxBookingDate) return true;
                  return false;
                }}
                timeZone={placeTimeZone}
                initialFocus
              />
            </DialogContent>
          </Dialog>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
            {isMobileRefreshing && (
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating availability...
              </div>
            )}
            {isMobileLoading ? (
              <TimeRangePickerSkeleton count={5} />
            ) : mobileDaySlots.length > 0 ? (
              <TimeRangePicker
                slots={mobileDaySlots}
                timeZone={placeTimeZone}
                selectedStartTime={selectedRange?.startTime}
                selectedDurationMinutes={selectedRange?.durationMinutes}
                showPrice
                onChange={
                  selectionMode === "any"
                    ? onAnyRangeChange
                    : onCourtRangeChange
                }
                onClear={onClearSelection}
                onContinue={onReserve}
              />
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No available slots for this date.
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-border bg-background px-5 py-4">
        <div className="min-w-0">
          {hasSelection && selectionSummary ? (
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
        {canAddToCart ? (
          <Button onClick={onAddToCartAction}>Add to booking</Button>
        ) : canCheckoutFromCart ? (
          <Button onClick={onReserve}>Checkout ({cartItemCount})</Button>
        ) : (
          <Button disabled={!hasSelection} onClick={onReserve}>
            Reserve
          </Button>
        )}
      </div>
    </div>
  );
}
