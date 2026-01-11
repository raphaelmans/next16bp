"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { appRoutes } from "@/shared/lib/app-routes";

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
          <Link href={appRoutes.reservations.base}>View My Reservations</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
