"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface ReservationNotFoundProps {
  reservationId?: string;
}

export function ReservationNotFound({
  reservationId,
}: ReservationNotFoundProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>Reservation Not Found</EmptyTitle>
        <EmptyDescription>
          {reservationId
            ? `We couldn't find a reservation with ID "${reservationId}".`
            : "The reservation you're looking for doesn't exist or may have been removed."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/reservations">View My Reservations</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
