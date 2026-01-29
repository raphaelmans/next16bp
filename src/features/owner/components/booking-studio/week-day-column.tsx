"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DraftTimelineBlock } from "./draft-row-card";
import { TimelineBlockItem } from "./timeline-block-item";
import { TimelineDropRow } from "./timeline-drop-row";
import { TimelineReservationItem } from "./timeline-reservation-item";
import type { CourtBlockItem, DraftRowItem, ReservationItem } from "./types";

export const WeekDayColumn = React.memo(function WeekDayColumn({
  dayKey,
  hours,
  blocks,
  draftBlocks,
  reservations,
  timeZone,
  disabled,
  isPastDay,
  pendingBlockIds,
  onRemoveBlock,
}: {
  dayKey: string;
  hours: number[];
  blocks: Array<{ block: CourtBlockItem; topOffset: number; height: number }>;
  draftBlocks: Array<{
    row: DraftRowItem;
    topOffset: number;
    height: number;
  }>;
  reservations: Array<{
    reservation: ReservationItem;
    topOffset: number;
    height: number;
  }>;
  timeZone: string;
  disabled: boolean;
  isPastDay?: boolean;
  pendingBlockIds: Set<string>;
  onRemoveBlock?: (blockId: string) => void;
}) {
  return (
    <div
      className={cn(
        "relative border-l border-border/70",
        isPastDay && "bg-muted/40",
      )}
    >
      <div className="space-y-0">
        {hours.map((hour) => (
          <TimelineDropRow
            key={`week-drop-${dayKey}-${hour}`}
            dayKey={dayKey}
            startMinute={hour * 60}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {blocks.map(({ block, topOffset, height }) => (
          <TimelineBlockItem
            key={block.id}
            block={block}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
            disabled={disabled}
            isPending={pendingBlockIds.has(block.id)}
            isPastDay={isPastDay}
            compact
            onRemove={onRemoveBlock}
          />
        ))}
        {draftBlocks.map(({ row, topOffset, height }) => (
          <DraftTimelineBlock
            key={`draft-${row.id}`}
            row={row}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
          />
        ))}
        {reservations.map(({ reservation, topOffset, height }) => (
          <TimelineReservationItem
            key={`res-${reservation.id}`}
            reservation={reservation}
            topOffset={topOffset}
            height={height}
            timeZone={timeZone}
            compact
          />
        ))}
      </div>
    </div>
  );
});
