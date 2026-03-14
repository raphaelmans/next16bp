"use client";

import { AlertTriangle, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import Link from "next/link";
import { formatRelativeFrom } from "@/common/format";
import { useNowMs } from "@/common/hooks/use-now";
import { getPlayerReservationPath } from "@/common/reservation-links";
import type { ReservationStatus } from "@/components/kudos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatusBannerProps {
  status: ReservationStatus;
  reservationId: string;
  expiresAt?: Date | string;
  cancellationReason?: string;
  className?: string;
  onMessageOwner?: (() => void) | undefined;
  onPayNow?: (() => void) | undefined;
  counterpartyLabel?: string;
}

const CHAT_ENABLED_STATUSES: ReservationStatus[] = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
];

export function StatusBanner({
  status,
  reservationId,
  expiresAt,
  cancellationReason,
  className,
  onMessageOwner,
  onPayNow,
  counterpartyLabel = "owner",
}: StatusBannerProps) {
  const config = statusBannerConfig[status];
  const nowMs = useNowMs({ intervalMs: 30_000 });

  if (!config) return null;

  const Icon = config.icon;
  const showPayButton = status === "AWAITING_PAYMENT";
  const showMessageOwnerButton =
    !!onMessageOwner && CHAT_ENABLED_STATUSES.includes(status);
  const showCountdown = status === "AWAITING_PAYMENT" && expiresAt;
  const countdownLabel =
    showCountdown && expiresAt ? formatRelativeFrom(expiresAt, nowMs) : null;
  const playerActionPath = getPlayerReservationPath({ reservationId, status });

  return (
    <Alert
      className={cn(config.className, className)}
      variant={config.variant as "default" | "destructive"}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {config.title}
        {showCountdown && countdownLabel && (
          <span className="text-sm font-normal">
            (Expires {countdownLabel})
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {status === "CANCELLED" && cancellationReason
            ? `Reason: ${cancellationReason}`
            : config.description(counterpartyLabel)}
        </span>
        {showMessageOwnerButton || showPayButton ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {showMessageOwnerButton ? (
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
                onClick={onMessageOwner}
              >
                {`Message ${capitalizeLabel(counterpartyLabel)}`}
              </Button>
            ) : null}
            {showPayButton ? (
              onPayNow ? (
                <Button
                  size="sm"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={onPayNow}
                >
                  Pay now to hold slot
                </Button>
              ) : (
                <Button size="sm" asChild className="w-full sm:w-auto">
                  <Link href={playerActionPath}>Pay now to hold slot</Link>
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

const statusBannerConfig: Record<
  ReservationStatus,
  {
    icon: typeof CheckCircle;
    title: string;
    description: (counterpartyLabel: string) => string;
    className: string;
    variant: string;
  }
> = {
  CREATED: {
    icon: Info,
    title: "Processing",
    description: (counterpartyLabel) =>
      `${capitalizeLabel(counterpartyLabel)} review is in progress. Message the ${counterpartyLabel} if needed.`,
    className:
      "border-primary/20 bg-primary/5 text-primary [&>svg]:text-primary",
    variant: "default",
  },
  AWAITING_PAYMENT: {
    icon: AlertTriangle,
    title: "Payment Required",
    description: (counterpartyLabel) =>
      `Pay now to keep this slot. Then mark payment for ${counterpartyLabel} confirmation.`,
    className:
      "border-warning/20 bg-warning/5 text-warning [&>svg]:text-warning",
    variant: "default",
  },
  PAYMENT_MARKED_BY_USER: {
    icon: Clock,
    title: "Payment Pending Confirmation",
    description: (counterpartyLabel) =>
      `Payment marked. The ${counterpartyLabel} will verify and confirm shortly.`,
    className:
      "border-primary/20 bg-primary/5 text-primary [&>svg]:text-primary",
    variant: "default",
  },
  CONFIRMED: {
    icon: CheckCircle,
    title: "Reservation Confirmed",
    description: (counterpartyLabel) =>
      counterpartyLabel === "coach"
        ? "Your booking is confirmed. Coordinate with your coach for the session."
        : "Your booking is confirmed! See you at the venue.",
    className:
      "border-success/20 bg-success/5 text-success [&>svg]:text-success",
    variant: "default",
  },
  EXPIRED: {
    icon: XCircle,
    title: "Reservation Expired",
    description: () =>
      "This reservation has expired because payment was not completed in time.",
    className: "",
    variant: "destructive",
  },
  CANCELLED: {
    icon: XCircle,
    title: "Reservation Cancelled",
    description: () => "This reservation has been cancelled.",
    className:
      "border-muted bg-muted/50 text-muted-foreground [&>svg]:text-muted-foreground",
    variant: "default",
  },
};

function capitalizeLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
