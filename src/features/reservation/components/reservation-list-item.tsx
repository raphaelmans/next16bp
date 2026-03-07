"use client";

import { CreditCard, Eye, MoreHorizontal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTimeRange,
} from "@/common/format";
import { getPlayerReservationPaymentPath } from "@/common/reservation-links";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReservationListItem as ReservationListItemType } from "../hooks";

interface ReservationListItemProps {
  reservation: ReservationListItemType;
}

export function ReservationListItem({ reservation }: ReservationListItemProps) {
  const { court, timeSlot, status, id } = reservation;
  const imageUrl = court.coverImageUrl?.trim();
  const canPay = status === "AWAITING_PAYMENT";
  const isGroup =
    reservation.isGroupPrimary && (reservation.groupItemCount ?? 0) > 1;
  const hasOpenPlay = !isGroup && Boolean(reservation.openPlayId);
  const canCancel =
    !isGroup &&
    ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"].includes(status);
  const detailHref = appRoutes.reservations.detail(id);
  const paymentHref = getPlayerReservationPaymentPath(id);

  return (
    <Card className={cn("p-4", status === "EXPIRED" && "opacity-60")}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Court image */}
        <div className="relative h-32 sm:h-20 sm:w-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={court.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="text-primary/40 font-heading text-lg">KC</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {court.placeSlug ? (
                  <Link
                    href={appRoutes.places.detail(court.placeSlug)}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {court.name}
                  </Link>
                ) : (
                  court.name
                )}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {court.address}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isGroup ? (
                <Badge variant="secondary" className="text-[11px]">
                  {reservation.groupItemCount} courts
                </Badge>
              ) : null}
              {hasOpenPlay ? (
                <Badge variant="secondary" className="text-[11px]">
                  Open Play
                </Badge>
              ) : null}
              <KudosStatusBadge
                status={status as ReservationStatus}
                size="sm"
                className="shrink-0"
              />
            </div>
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
            <Link href={detailHref}>View</Link>
          </Button>
          {!isGroup &&
            (hasOpenPlay ? (
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={!reservation.openPlayId}
              >
                <Link
                  href={appRoutes.openPlay.detail(reservation.openPlayId ?? "")}
                >
                  Open Play
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/reservations/${id}?openPlay=1`}>
                  Set up Open Play
                </Link>
              </Button>
            ))}
          {canPay && (
            <Button size="sm" asChild>
              <Link href={paymentHref}>Pay Now</Link>
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
                <Link href={detailHref}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canPay && (
                <DropdownMenuItem asChild>
                  <Link href={paymentHref}>
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
            <Link href={detailHref}>View Details</Link>
          </Button>
          {!isGroup &&
            (hasOpenPlay ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
                disabled={!reservation.openPlayId}
              >
                <Link
                  href={appRoutes.openPlay.detail(reservation.openPlayId ?? "")}
                >
                  Open Play
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/reservations/${id}?openPlay=1`}>Open Play</Link>
              </Button>
            ))}
          {canPay && (
            <Button size="sm" className="flex-1" asChild>
              <Link href={paymentHref}>Pay Now</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
