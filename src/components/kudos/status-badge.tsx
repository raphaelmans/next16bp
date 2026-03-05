"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Reservation status types matching the database enum
 */
export type ReservationStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

/**
 * Status configuration with variant and display label
 */
const statusConfig: Record<
  ReservationStatus,
  {
    variant: "primary" | "warning" | "success" | "destructive" | "secondary";
    label: string;
  }
> = {
  CREATED: { variant: "primary", label: "Processing" },
  AWAITING_PAYMENT: { variant: "warning", label: "Awaiting Payment" },
  PAYMENT_MARKED_BY_USER: { variant: "primary", label: "Payment Pending" },
  CONFIRMED: { variant: "success", label: "Confirmed" },
  EXPIRED: { variant: "destructive", label: "Expired" },
  CANCELLED: { variant: "secondary", label: "Cancelled" },
};

const kudosStatusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary border border-primary/20",
        warning:
          "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        success:
          "bg-green-500/10 text-green-600 border border-green-500/20",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20",
        secondary: "bg-muted text-muted-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface KudosStatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof kudosStatusBadgeVariants> {
  status: ReservationStatus;
}

export function KudosStatusBadge({
  status,
  size,
  className,
  ...props
}: KudosStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      data-slot="kudos-status-badge"
      data-status={status}
      className={cn(
        kudosStatusBadgeVariants({ variant: config.variant, size }),
        className,
      )}
      {...props}
    >
      {config.label}
    </span>
  );
}
