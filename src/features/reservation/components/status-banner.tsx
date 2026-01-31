"use client";

import { AlertTriangle, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/common/format";
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
}

export function StatusBanner({
  status,
  reservationId,
  expiresAt,
  cancellationReason,
  className,
}: StatusBannerProps) {
  const config = statusBannerConfig[status];

  if (!config) return null;

  const Icon = config.icon;
  const showPayButton = status === "AWAITING_PAYMENT";
  const showCountdown = status === "AWAITING_PAYMENT" && expiresAt;

  return (
    <Alert
      className={cn(config.className, className)}
      variant={config.variant as "default" | "destructive"}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {config.title}
        {showCountdown && (
          <span className="text-sm font-normal">
            (Expires {formatRelative(expiresAt)})
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {status === "CANCELLED" && cancellationReason
            ? `Reason: ${cancellationReason}`
            : config.description}
        </span>
        {showPayButton && (
          <Button size="sm" asChild className="w-fit">
            <Link href={`/reservations/${reservationId}/payment`}>Pay Now</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

const statusBannerConfig: Record<
  ReservationStatus,
  {
    icon: typeof CheckCircle;
    title: string;
    description: string;
    className: string;
    variant: string;
  }
> = {
  CREATED: {
    icon: Info,
    title: "Processing",
    description: "Your reservation is being processed.",
    className:
      "border-primary/20 bg-primary/5 text-primary [&>svg]:text-primary",
    variant: "default",
  },
  AWAITING_PAYMENT: {
    icon: AlertTriangle,
    title: "Payment Required",
    description: "Please complete your payment to confirm this reservation.",
    className:
      "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500",
    variant: "default",
  },
  PAYMENT_MARKED_BY_USER: {
    icon: Clock,
    title: "Payment Pending Confirmation",
    description:
      "Your payment is being verified by the court owner. This usually takes a few hours.",
    className:
      "border-primary/20 bg-primary/5 text-primary [&>svg]:text-primary",
    variant: "default",
  },
  CONFIRMED: {
    icon: CheckCircle,
    title: "Reservation Confirmed",
    description: "Your booking is confirmed! See you at the court.",
    className:
      "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-500 [&>svg]:text-green-600 dark:[&>svg]:text-green-500",
    variant: "default",
  },
  EXPIRED: {
    icon: XCircle,
    title: "Reservation Expired",
    description:
      "This reservation has expired because payment was not completed in time.",
    className: "",
    variant: "destructive",
  },
  CANCELLED: {
    icon: XCircle,
    title: "Reservation Cancelled",
    description: "This reservation has been cancelled.",
    className:
      "border-muted bg-muted/50 text-muted-foreground [&>svg]:text-muted-foreground",
    variant: "default",
  },
};
