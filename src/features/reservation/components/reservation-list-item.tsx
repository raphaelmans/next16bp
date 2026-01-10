"use client";

import { CreditCard, Eye, MoreHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  KudosStatusBadge,
  type ReservationStatus,
} from "@/shared/components/kudos";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/shared/lib/format";
import type { ReservationListItem as ReservationListItemType } from "../hooks/use-my-reservations";

interface ReservationListItemProps {
  reservation: ReservationListItemType;
}

export function ReservationListItem({ reservation }: ReservationListItemProps) {
  const { court, timeSlot, status, id } = reservation;
  const canPay = status === "AWAITING_PAYMENT";
  const canCancel = [
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
  ].includes(status);

  return (
    <Card className={cn("p-4", status === "EXPIRED" && "opacity-60")}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Court image */}
        <div className="relative h-32 sm:h-20 sm:w-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted">
          {court.coverImageUrl ? (
            <Image
              src={court.coverImageUrl}
              alt={court.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {court.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {court.address}
              </p>
            </div>
            <KudosStatusBadge
              status={status as ReservationStatus}
              size="sm"
              className="shrink-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatDateShort(timeSlot.startTime)}</span>
            <span>{formatTimeRange(timeSlot.startTime, timeSlot.endTime)}</span>
            <span className="font-medium text-foreground">
              {formatCurrency(timeSlot.priceCents, timeSlot.currency)}
            </span>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reservations/${id}`}>View</Link>
          </Button>
          {canPay && (
            <Button size="sm" asChild>
              <Link href={`/reservations/${id}/payment`}>Pay Now</Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/reservations/${id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canPay && (
                <DropdownMenuItem asChild>
                  <Link href={`/reservations/${id}/payment`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Link>
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem className="text-destructive">
                  <X className="mr-2 h-4 w-4" />
                  Cancel Reservation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/reservations/${id}`}>View Details</Link>
          </Button>
          {canPay && (
            <Button size="sm" className="flex-1" asChild>
              <Link href={`/reservations/${id}/payment`}>Pay Now</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
