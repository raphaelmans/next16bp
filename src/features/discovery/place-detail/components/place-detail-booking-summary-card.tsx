"use client";

import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/common/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}: PlaceDetailBookingSummaryCardProps) {
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
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Duration</p>
          <p className="font-medium">{formatDuration(durationMinutes)}</p>
        </div>
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
                    "h:mm a",
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
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Select a time to see the price and continue.
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
