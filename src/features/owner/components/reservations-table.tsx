"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Receipt,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Reservation,
  ReservationStatus,
} from "../hooks/use-owner-reservations";

interface ReservationsTableProps {
  reservations: Reservation[];
  onConfirm?: (reservationId: string) => void;
  onReject?: (reservationId: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  ReservationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "default" },
  confirmed: { label: "Confirmed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  completed: { label: "Completed", variant: "outline" },
};

export function ReservationsTable({
  reservations,
  onConfirm,
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

  // Mobile card view
  const MobileCard = ({ reservation }: { reservation: Reservation }) => {
    const config = statusConfig[reservation.status];
    const isExpanded = expandedRow === reservation.id;

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
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
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

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
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
                View Details
              </>
            )}
          </Button>

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

              {reservation.paymentReference && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Payment Proof</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span>Ref: {reservation.paymentReference}</span>
                    </div>
                    {reservation.paymentProofUrl && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        asChild
                      >
                        <a
                          href={reservation.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Receipt Image
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {reservation.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {reservation.notes}
                  </p>
                </div>
              )}

              {reservation.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onConfirm?.(reservation.id)}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
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
      <div className="md:hidden">
        {reservations.map((reservation) => (
          <MobileCard key={reservation.id} reservation={reservation} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => {
              const config = statusConfig[reservation.status];
              const isExpanded = expandedRow === reservation.id;

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
                      {reservation.courtName}
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
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatPrice(
                        reservation.amountCents,
                        reservation.currency,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {reservation.status === "pending" && (
                        <div className="flex justify-end gap-2">
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
                        </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 p-6">
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
                          {reservation.paymentReference && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">
                                Payment Proof
                              </h4>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    Ref: {reservation.paymentReference}
                                  </span>
                                </div>
                                {reservation.paymentProofUrl && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0"
                                    asChild
                                  >
                                    <a
                                      href={reservation.paymentProofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View Receipt Image
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

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
