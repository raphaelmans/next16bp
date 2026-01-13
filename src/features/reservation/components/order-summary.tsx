"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatDateShortInTimeZone,
  formatTimeRange,
  formatTimeRangeInTimeZone,
} from "@/shared/lib/format";

interface OrderSummaryProps {
  timeSlot: {
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
  };
  timeZone?: string;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onConfirm: () => void;
  onReviewDetails?: () => void;
  reviewLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OrderSummary({
  timeSlot,
  timeZone,
  termsAccepted,
  onTermsChange,
  onConfirm,
  onReviewDetails,
  reviewLabel = "Review details",
  isSubmitting = false,
  disabled = false,
  className,
}: OrderSummaryProps) {
  const dateLabel = timeZone
    ? formatDateShortInTimeZone(timeSlot.startTime, timeZone)
    : formatDateShort(timeSlot.startTime);
  const timeLabel = timeZone
    ? formatTimeRangeInTimeZone(timeSlot.startTime, timeSlot.endTime, timeZone)
    : formatTimeRange(timeSlot.startTime, timeSlot.endTime);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {onReviewDetails && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-accent hover:text-accent"
            onClick={onReviewDetails}
          >
            {reviewLabel}
          </Button>
        )}

        {/* Date and Time */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{dateLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span>{timeLabel}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Court fee</span>
            <span>
              {formatCurrency(timeSlot.priceCents, timeSlot.currency)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between font-medium text-lg pt-4 border-t">
          <span>Total</span>
          <span>{formatCurrency(timeSlot.priceCents, timeSlot.currency)}</span>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-2 pt-4">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked === true)}
          />
          <Label
            htmlFor="terms"
            className="text-sm leading-snug cursor-pointer"
          >
            I agree to the{" "}
            <a
              href={appRoutes.terms.base}
              className="text-primary hover:underline"
            >
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a
              href={appRoutes.privacy.base}
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </Label>
        </div>

        {/* Confirm Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={onConfirm}
          disabled={disabled || !termsAccepted || isSubmitting}
        >
          {isSubmitting ? "Confirming..." : "Confirm Booking"}
        </Button>
      </CardContent>
    </Card>
  );
}
