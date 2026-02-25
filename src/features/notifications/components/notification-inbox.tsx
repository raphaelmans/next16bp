"use client";

import { BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type NotificationInboxItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | Date | null;
  createdAt: string | Date;
};

const formatRelativeTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, unitSeconds] of units) {
    if (Math.abs(diffSeconds) >= unitSeconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / unitSeconds), unit);
    }
  }

  return "";
};

export function NotificationInbox(props: {
  items: NotificationInboxItem[];
  isLoading: boolean;
  showMarkAll: boolean;
  markAllBusy: boolean;
  onItemClick: (item: NotificationInboxItem) => void;
  onMarkAllAsRead: () => void;
}) {
  const {
    items,
    isLoading,
    showMarkAll,
    markAllBusy,
    onItemClick,
    onMarkAllAsRead,
  } = props;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <p className="text-sm font-heading font-semibold">Notifications</p>
        {showMarkAll ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto px-2 py-1 text-xs"
            onClick={onMarkAllAsRead}
            disabled={markAllBusy}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      <ScrollArea className="h-[320px] px-3 pb-2">
        {isLoading ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <Empty className="border-0 px-0 py-8">
            <EmptyHeader>
              <EmptyTitle>No notifications yet</EmptyTitle>
              <EmptyDescription>New updates will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <ItemGroup className="gap-1 py-1">
            {items.map((item, index) => {
              const isRead = Boolean(item.readAt);
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onItemClick(item)}
                  >
                    <Item
                      size="sm"
                      variant="outline"
                      className={cn(
                        "w-full cursor-pointer",
                        !isRead && "bg-accent/30",
                      )}
                    >
                      <ItemContent>
                        <ItemHeader className="w-full">
                          <ItemTitle className="line-clamp-1">
                            {item.title}
                          </ItemTitle>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </ItemHeader>
                        <div className="flex items-start gap-2">
                          {!isRead ? (
                            <BellDot className="mt-0.5 h-3.5 w-3.5 text-red-500" />
                          ) : null}
                          <ItemDescription className="line-clamp-2">
                            {item.body ?? "Open notification"}
                          </ItemDescription>
                        </div>
                      </ItemContent>
                    </Item>
                  </button>
                  {index < items.length - 1 ? <ItemSeparator /> : null}
                </div>
              );
            })}
          </ItemGroup>
        ) : null}
      </ScrollArea>
    </div>
  );
}
