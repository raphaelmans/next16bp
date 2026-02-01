"use client";

import * as React from "react";
import { formatCurrency, formatTimeRangeInTimeZone } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationItem } from "./types";

export const TimelineReservationItem = React.memo(
  function TimelineReservationItem({
    reservation,
    topOffset,
    height,
    timeZone,
    compact,
    onClick,
  }: {
    reservation: ReservationItem;
    topOffset: number;
    height: number;
    timeZone: string;
    compact?: boolean;
    onClick?: () => void;
  }) {
    const isGuest = Boolean(reservation.guestProfileId);
    const label =
      reservation.playerNameSnapshot ?? (isGuest ? "Guest" : "Player");
    const statusLabel =
      reservation.status === "CONFIRMED"
        ? "Confirmed"
        : reservation.status === "CREATED"
          ? "Pending"
          : reservation.status;

    const baseClassName = cn(
      "pointer-events-auto absolute overflow-hidden rounded-lg border bg-card/90 text-card-foreground shadow-sm",
      compact
        ? "left-0.5 right-0.5 border-l-2 px-1 py-0.5"
        : "left-1 right-1 border-l-4 px-3 py-2",
      "border-l-emerald-500",
      onClick
        ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        : "cursor-default",
    );

    return onClick ? (
      <button
        type="button"
        style={{ top: topOffset, height }}
        className={baseClassName}
        onClick={onClick}
      >
        <div
          className={cn(
            "flex items-center justify-between",
            compact ? "gap-0.5" : "gap-2",
          )}
        >
          {compact ? (
            <span className="text-[10px] font-semibold truncate text-emerald-600">
              R
            </span>
          ) : (
            <Badge variant="success" className="text-[10px] px-1.5 py-0">
              {statusLabel}
            </Badge>
          )}
          {!compact && reservation.totalPriceCents > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(
                reservation.totalPriceCents,
                reservation.currency,
              )}
            </span>
          )}
        </div>
        {!compact && (
          <div className="mt-1 text-xs font-medium">
            {formatTimeRangeInTimeZone(
              reservation.startTime,
              reservation.endTime,
              timeZone,
            )}
          </div>
        )}
        {compact && (
          <div className="text-[9px] text-muted-foreground truncate">
            {formatTimeRangeInTimeZone(
              reservation.startTime,
              reservation.endTime,
              timeZone,
            )}
          </div>
        )}
        <div
          className={cn(
            "truncate",
            compact
              ? "text-[9px] text-muted-foreground"
              : "text-[11px] text-muted-foreground",
          )}
        >
          {label}
        </div>
      </button>
    ) : (
      <div style={{ top: topOffset, height }} className={baseClassName}>
        <div
          className={cn(
            "flex items-center justify-between",
            compact ? "gap-0.5" : "gap-2",
          )}
        >
          {compact ? (
            <span className="text-[10px] font-semibold truncate text-emerald-600">
              R
            </span>
          ) : (
            <Badge variant="success" className="text-[10px] px-1.5 py-0">
              {statusLabel}
            </Badge>
          )}
          {!compact && reservation.totalPriceCents > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(
                reservation.totalPriceCents,
                reservation.currency,
              )}
            </span>
          )}
        </div>
        {!compact && (
          <div className="mt-1 text-xs font-medium">
            {formatTimeRangeInTimeZone(
              reservation.startTime,
              reservation.endTime,
              timeZone,
            )}
          </div>
        )}
        {compact && (
          <div className="text-[9px] text-muted-foreground truncate">
            {formatTimeRangeInTimeZone(
              reservation.startTime,
              reservation.endTime,
              timeZone,
            )}
          </div>
        )}
        <div
          className={cn(
            "truncate",
            compact
              ? "text-[9px] text-muted-foreground"
              : "text-[11px] text-muted-foreground",
          )}
        >
          {label}
        </div>
      </div>
    );
  },
);
