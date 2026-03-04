"use client";

import { X } from "lucide-react";
import { addMinutes } from "date-fns";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/common/format";
import { getZonedDayKey } from "@/common/time-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";

type CourtOption = {
  id: string;
  label: string;
};

type SelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

type PlaceDetailBookingSummaryCardProps = {
  selectionMode: "any" | "court";
  courtsForSport: CourtOption[];
  selectedCourtId?: string;
  selectedAddonCount: number;
  durationMinutes: number;
  hasSelection: boolean;
  selectionSummary: SelectionSummary | null;
  placeTimeZone: string;
  summaryCtaVariant: "default" | "outline";
  summaryCtaLabel: string;
  onSummaryAction: () => void;
  isAuthenticated: boolean;
  cartItems: BookingCartItem[];
  canAddToCart: boolean;
  onAddToCartAction: () => void;
  onRemoveFromCartAction: (key: string) => void;
};

export function PlaceDetailBookingSummaryCard({
  selectionMode,
  courtsForSport,
  selectedCourtId,
  selectedAddonCount,
  durationMinutes,
  hasSelection,
  selectionSummary,
  placeTimeZone,
  summaryCtaVariant,
  summaryCtaLabel,
  onSummaryAction,
  isAuthenticated,
  cartItems,
  canAddToCart,
  onAddToCartAction,
  onRemoveFromCartAction,
}: PlaceDetailBookingSummaryCardProps) {
  const estimatedTotalCents = cartItems.reduce(
    (sum, item) => sum + (item.estimatedPriceCents ?? 0),
    0,
  );
  const cartCurrency = cartItems[0]?.currency ?? "PHP";
  const hasEstimate = cartItems.some((i) => i.estimatedPriceCents !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Court</p>
          <p className="font-medium">
            {selectionMode === "any"
              ? "Any available court"
              : (courtsForSport.find((court) => court.id === selectedCourtId)
                  ?.label ?? "Select a court")}
          </p>
        </div>
        {hasSelection && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{formatDuration(durationMinutes)}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Optional extras</p>
          <p className="font-medium">
            {selectedAddonCount > 0
              ? `${selectedAddonCount} selected`
              : "Choose extras during booking"}
          </p>
        </div>
        {hasSelection && selectionSummary ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Selected time</p>
            <p className="font-medium">
              {formatInTimeZone(
                new Date(selectionSummary.startTime),
                placeTimeZone,
                "MMM d, h:mm a",
              )}{" "}
              {selectionSummary.endTime
                ? `- ${formatInTimeZone(
                    new Date(selectionSummary.endTime),
                    placeTimeZone,
                    getZonedDayKey(
                      selectionSummary.startTime,
                      placeTimeZone,
                    ) !==
                      getZonedDayKey(selectionSummary.endTime, placeTimeZone)
                      ? "MMM d, h:mm a"
                      : "h:mm a",
                  )}`
                : ""}
              {selectionSummary.totalCents !== undefined
                ? ` · ${formatCurrency(
                    selectionSummary.totalCents,
                    selectionSummary.currency,
                  )}`
                : ""}
            </p>
          </div>
        ) : cartItems.length > 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            You have {cartItems.length} court
            {cartItems.length !== 1 ? "s" : ""} in booking. Continue to checkout
            when ready.
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Select a time to see the price and continue.
          </div>
        )}

        {canAddToCart && (
          <Button
            size="lg"
            className="w-full"
            variant="secondary"
            onClick={onAddToCartAction}
          >
            Add to booking
          </Button>
        )}

        {cartItems.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">
              Courts in booking ({cartItems.length})
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
                          {crossesMidnight
                            ? ` - ${formatInTimeZone(endTime, placeTimeZone, "MMM d, h:mm a")}`
                            : ""}{" "}
                          · {formatDuration(item.durationMinutes)}
                          {item.estimatedPriceCents !== null
                            ? ` · ${formatCurrency(item.estimatedPriceCents, item.currency)}`
                            : ""}
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
            {hasEstimate && (
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <p className="text-muted-foreground">Estimated total</p>
                <p className="font-semibold">
                  {formatCurrency(estimatedTotalCents, cartCurrency)}
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          variant={summaryCtaVariant}
          onClick={onSummaryAction}
        >
          {summaryCtaLabel}
        </Button>

        {!isAuthenticated && hasSelection && (
          <p className="text-center text-xs text-muted-foreground">
            Sign in to complete your booking request.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
