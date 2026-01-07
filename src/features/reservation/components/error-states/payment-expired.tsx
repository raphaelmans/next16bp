"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface PaymentExpiredProps {
  courtName?: string;
}

export function PaymentExpired({ courtName }: PaymentExpiredProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Clock />
        </EmptyMedia>
        <EmptyTitle>Payment Time Expired</EmptyTitle>
        <EmptyDescription>
          {courtName
            ? `Your reservation at ${courtName} has expired because payment was not completed in time. The slot has been released.`
            : "Your reservation has expired because payment was not completed in time. The slot has been released and may be booked by another player."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/courts">Book Another Slot</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
