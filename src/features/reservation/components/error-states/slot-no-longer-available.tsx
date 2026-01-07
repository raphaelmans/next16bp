"use client";

import Link from "next/link";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface SlotNoLongerAvailableProps {
  courtName?: string;
  onFindNewSlot?: () => void;
}

export function SlotNoLongerAvailable({
  courtName,
  onFindNewSlot,
}: SlotNoLongerAvailableProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarX />
        </EmptyMedia>
        <EmptyTitle>Slot No Longer Available</EmptyTitle>
        <EmptyDescription>
          {courtName
            ? `The time slot you selected at ${courtName} is no longer available. It may have been booked by another player.`
            : "The time slot you selected is no longer available. It may have been booked by another player."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {onFindNewSlot ? (
          <Button onClick={onFindNewSlot}>Find Another Slot</Button>
        ) : (
          <Button asChild>
            <Link href="/courts">Browse Courts</Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
