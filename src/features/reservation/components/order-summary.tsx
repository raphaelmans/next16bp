"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/shared/lib/format";

interface OrderSummaryProps {
  timeSlot: {
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
  };
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OrderSummary({
  timeSlot,
  termsAccepted,
  onTermsChange,
  onConfirm,
  isSubmitting = false,
  disabled = false,
  className,
}: OrderSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDateShort(timeSlot.startTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span>{formatTimeRange(timeSlot.startTime, timeSlot.endTime)}</span>
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
            <a href="/terms" className="text-primary hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
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
