"use client";

import { formatRelative } from "@/common/format";
import { cn } from "@/lib/utils";

export type TimelineItemStatus = "success" | "warning" | "error" | "default";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: TimelineItemStatus;
}

const statusColors: Record<TimelineItemStatus, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  default: "bg-primary",
};

export interface KudosTimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
}

export function KudosTimeline({
  items,
  className,
  ...props
}: KudosTimelineProps) {
  // Sort items by timestamp, most recent first
  const sortedItems = [...items].sort((a, b) => {
    const dateA =
      typeof a.timestamp === "string" ? new Date(a.timestamp) : a.timestamp;
    const dateB =
      typeof b.timestamp === "string" ? new Date(b.timestamp) : b.timestamp;
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div
      data-slot="kudos-timeline"
      className={cn("relative space-y-0", className)}
      {...props}
    >
      {sortedItems.map((item, index) => (
        <KudosTimelineItem
          key={item.id}
          item={item}
          isLast={index === sortedItems.length - 1}
        />
      ))}
    </div>
  );
}

interface KudosTimelineItemProps {
  item: TimelineItem;
  isLast: boolean;
}

function KudosTimelineItem({ item, isLast }: KudosTimelineItemProps) {
  const status = item.status ?? "default";
  const dotColor = statusColors[status];

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
      )}

      {/* Dot */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={cn(
            "size-[14px] rounded-full border-2 border-background",
            dotColor,
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelative(item.timestamp)}
          </time>
        </div>
        {item.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export { KudosTimelineItem };
