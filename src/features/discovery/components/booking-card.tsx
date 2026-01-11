"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  KudosDatePicker,
  type TimeSlot,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
} from "@/shared/components/kudos";
import { formatCurrency } from "@/shared/lib/format";

interface BookingCardProps {
  courtId: string;
  pricePerHourCents?: number;
  currency?: string;
  isFree?: boolean;
  slots?: TimeSlot[];
  isLoadingSlots?: boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  selectedSlotId?: string;
  onSlotSelect?: (slot: TimeSlot) => void;
  className?: string;
}

export function BookingCard({
  courtId,
  pricePerHourCents,
  currency = "PHP",
  isFree = false,
  slots = [],
  isLoadingSlots = false,
  selectedDate,
  onDateChange,
  selectedSlotId,
  onSlotSelect,
  className,
}: BookingCardProps) {
  const router = useRouter();
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const selectedSlotPrice = selectedSlot?.priceCents ?? pricePerHourCents;
  const hasSelectedPrice = selectedSlotPrice !== undefined;
  const isFreeCourt = isFree;

  const { data: sessionUser } = useSession();
  const isAuthenticated = !!sessionUser;

  const handleReserveClick = () => {
    if (!selectedSlot) return;

    if (isAuthenticated) {
      router.push(`/courts/${courtId}/book/${selectedSlot.id}`);
    } else {
      // Redirect to login with return URL
      router.push(
        `/login?redirect=${encodeURIComponent(`/courts/${courtId}`)}`,
      );
    }
  };

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          {pricePerHourCents !== undefined ? (
            <>
              <span className="font-heading text-2xl font-bold">
                {formatCurrency(pricePerHourCents, currency)}
              </span>
              <span className="text-sm text-muted-foreground font-normal">
                /hour
              </span>
            </>
          ) : (
            <span
              className={cn(
                "font-heading text-2xl font-bold",
                isFreeCourt ? "text-success" : "text-muted-foreground",
              )}
            >
              {isFreeCourt ? "Free" : "—"}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Select Date</p>
          <KudosDatePicker
            value={selectedDate}
            onChange={onDateChange}
            placeholder="Choose a date"
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Times</p>
            {isLoadingSlots ? (
              <TimeSlotPickerSkeleton count={6} />
            ) : slots.length > 0 ? (
              <TimeSlotPicker
                slots={slots}
                selectedId={selectedSlotId}
                onSelect={onSlotSelect}
                showPrice={true}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available slots for this date
              </p>
            )}
          </div>
        )}

        {/* Reserve Button */}
        {isAuthenticated ? (
          // Authenticated user - normal reserve flow
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedSlot}
            onClick={handleReserveClick}
          >
            {selectedSlot ? "Reserve Now" : "Select a time slot"}
          </Button>
        ) : (
          // Guest user - show sign in prompt
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleReserveClick}
            disabled={!selectedSlot}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {selectedSlot ? "Sign in to reserve" : "Select a time slot"}
          </Button>
        )}

        {/* Sign in hint for guests */}
        {!isAuthenticated && selectedSlot && (
          <p className="text-xs text-muted-foreground text-center">
            You need to{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(`/courts/${courtId}`)}`}
              className="text-primary hover:underline"
            >
              sign in
            </Link>{" "}
            or{" "}
            <Link
              href={`/register?redirect=${encodeURIComponent(`/courts/${courtId}`)}`}
              className="text-primary hover:underline"
            >
              create an account
            </Link>{" "}
            to reserve
          </p>
        )}

        {/* Summary */}
        {selectedSlot && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Slot price</span>
              <span>
                {hasSelectedPrice
                  ? formatCurrency(selectedSlotPrice ?? 0, currency)
                  : isFreeCourt
                    ? "Free"
                    : "—"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>
                {hasSelectedPrice
                  ? formatCurrency(selectedSlotPrice ?? 0, currency)
                  : isFreeCourt
                    ? "Free"
                    : "—"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
