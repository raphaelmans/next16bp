"use client";

import { format } from "date-fns";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Reservation } from "../hooks";
import { PaymentProofCard } from "./payment-proof-card";

interface ReservationsTableProps {
  reservations: Reservation[];
  onConfirm?: (reservationId: string) => void;
  onConfirmPaidOffline?: (reservationId: string) => void;
  onReject?: (reservationId: string) => void;
  isLoading?: boolean;
}

const stageConfig: Record<
  Reservation["reservationStatus"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  CREATED: {
    label: "Needs Acceptance",
    variant: "outline",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    variant: "outline",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  PAYMENT_MARKED_BY_USER: {
    label: "Payment Marked",
    variant: "outline",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "outline",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  EXPIRED: {
    label: "Expired",
    variant: "outline",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function shouldShowTtl(status: Reservation["reservationStatus"]) {
  return (
    status === "CREATED" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAYMENT_MARKED_BY_USER" ||
    status === "EXPIRED"
  );
}

export function ReservationsTable({
  reservations,
  onConfirm,
  onConfirmPaidOffline,
  onReject,
  isLoading,
}: ReservationsTableProps) {
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const GroupItems = ({ reservation }: { reservation: Reservation }) => {
    if (!reservation.isGroupPrimary || !reservation.groupItems?.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Grouped Items</h4>
        <div className="space-y-2">
          {reservation.groupItems.map((item) => (
            <div
              key={item.id}
              className="rounded-md border bg-background p-2 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium">{item.courtName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.date), "MMM d, yyyy")} ·{" "}
                  {item.startTime} - {item.endTime}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatPrice(item.amountCents, item.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stageConfig[item.reservationStatus]?.label ??
                    item.reservationStatus}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mobile card view
  const MobileCard = ({ reservation }: { reservation: Reservation }) => {
    const config = stageConfig[reservation.reservationStatus];
    const isExpanded = expandedRow === reservation.id;
    const canAccept = reservation.reservationStatus === "CREATED";
    const canConfirm =
      reservation.reservationStatus === "PAYMENT_MARKED_BY_USER";
    const canReject = canAccept || canConfirm;
    const confirmLabel = canAccept ? "Accept" : "Confirm";

    const createdAtDate = parseIsoDate(reservation.createdAt);
    const expiresAtDate = parseIsoDate(reservation.expiresAt);
    const ttlLabel =
      shouldShowTtl(reservation.reservationStatus) && expiresAtDate
        ? reservation.reservationStatus === "EXPIRED"
          ? `Expired ${format(expiresAtDate, "MMM d, h:mm a")}`
          : `Expires ${format(expiresAtDate, "MMM d, h:mm a")}`
        : null;

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium">{reservation.courtName}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(reservation.date), "MMM d, yyyy")} &middot;{" "}
                {reservation.startTime} - {reservation.endTime}
              </p>
              {reservation.isGroupPrimary && reservation.groupItemCount ? (
                <p className="text-xs text-muted-foreground">
                  Group booking · {reservation.groupItemCount} items
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Created{" "}
                {createdAtDate ? format(createdAtDate, "MMM d, h:mm a") : "--"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={config.variant}
                className={cn("whitespace-nowrap", config.className)}
              >
                {config.label}
              </Badge>
              {ttlLabel ? (
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {ttlLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{reservation.playerName}</span>
            </div>
            <span className="font-medium">
              {formatPrice(reservation.amountCents, reservation.currency)}
            </span>
          </div>

          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link
                href={appRoutes.organization.reservationDetail(reservation.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => toggleRow(reservation.id)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand
                </>
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Player Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{reservation.playerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{reservation.playerPhone}</span>
                  </div>
                </div>
              </div>

              <GroupItems reservation={reservation} />

              <PaymentProofCard proof={reservation.paymentProof ?? null} />

              {reservation.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {reservation.notes}
                  </p>
                </div>
              )}

              {canReject && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onConfirm?.(reservation.id)}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {confirmLabel}
                  </Button>
                  {canAccept && reservation.amountCents > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onConfirmPaidOffline?.(reservation.id)}
                      disabled={isLoading}
                    >
                      Paid & Confirmed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onReject?.(reservation.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Mobile view */}
      <div className="xl:hidden">
        {reservations.map((reservation) => (
          <MobileCard key={reservation.id} reservation={reservation} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden xl:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => {
              const config = stageConfig[reservation.reservationStatus];
              const isExpanded = expandedRow === reservation.id;
              const canAccept = reservation.reservationStatus === "CREATED";
              const canConfirm =
                reservation.reservationStatus === "PAYMENT_MARKED_BY_USER";
              const canReject = canAccept || canConfirm;

              const createdAtDate = parseIsoDate(reservation.createdAt);
              const expiresAtDate = parseIsoDate(reservation.expiresAt);
              const ttlLabel =
                shouldShowTtl(reservation.reservationStatus) && expiresAtDate
                  ? reservation.reservationStatus === "EXPIRED"
                    ? `Expired ${format(expiresAtDate, "MMM d, h:mm a")}`
                    : `Expires ${format(expiresAtDate, "MMM d, h:mm a")}`
                  : null;

              return (
                <React.Fragment key={reservation.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      isExpanded && "bg-muted/50",
                    )}
                    onClick={() => toggleRow(reservation.id)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{reservation.courtName}</p>
                        {reservation.isGroupPrimary &&
                        reservation.groupItemCount ? (
                          <p className="text-xs text-muted-foreground">
                            Group booking · {reservation.groupItemCount} items
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.playerPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>
                          {format(new Date(reservation.date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.startTime} - {reservation.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {createdAtDate
                            ? format(createdAtDate, "MMM d, h:mm a")
                            : "--"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatPrice(
                        reservation.amountCents,
                        reservation.currency,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={config.variant}
                          className={config.className}
                        >
                          {config.label}
                        </Badge>
                        {ttlLabel ? (
                          <p className="text-xs text-muted-foreground">
                            {ttlLabel}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={appRoutes.organization.reservationDetail(
                              reservation.id,
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canReject && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConfirm?.(reservation.id);
                              }}
                              disabled={isLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            {canAccept && reservation.amountCents > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onConfirmPaidOffline?.(reservation.id);
                                }}
                                disabled={isLoading}
                              >
                                Paid & Confirmed
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReject?.(reservation.id);
                              }}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="bg-muted/30 p-6 whitespace-normal"
                      >
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Player Details */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                              Player Details
                            </h4>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{reservation.playerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{reservation.playerEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{reservation.playerPhone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payment Proof */}
                          <PaymentProofCard
                            proof={reservation.paymentProof ?? null}
                          />

                          <GroupItems reservation={reservation} />

                          {/* Notes */}
                          {reservation.notes && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Notes</h4>
                              <p className="text-sm text-muted-foreground">
                                {reservation.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
