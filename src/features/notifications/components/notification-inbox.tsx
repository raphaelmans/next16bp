"use client";

import { ChevronRight } from "lucide-react";
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
  eventType: string;
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
  onMarkAsRead: (item: NotificationInboxItem) => void;
  onMarkAllAsRead: () => void;
}) {
  const {
    items,
    isLoading,
    showMarkAll,
    markAllBusy,
    onItemClick,
    onMarkAsRead,
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
          <ItemGroup className="gap-1.5 py-1">
            {items.map((item) => {
              const isRead = Boolean(item.readAt);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "group w-full text-left rounded-lg transition-colors duration-150",
                    !isRead || item.href
                      ? "hover:bg-muted/50 cursor-pointer"
                      : "cursor-default",
                  )}
                  onClick={() => {
                    if (!isRead) {
                      onMarkAsRead(item);
                    } else if (item.href) {
                      onItemClick(item);
                    }
                  }}
                >
                  <Item
                    size="sm"
                    variant="default"
                    className={cn(
                      "w-full border-l-2",
                      isRead
                        ? "border-l-transparent"
                        : "border-l-primary bg-primary/[0.04]",
                      isRead &&
                        item.href &&
                        "group-active:scale-[0.98] transition-transform duration-100",
                    )}
                  >
                    <ItemContent>
                      <ItemHeader className="w-full">
                        <ItemTitle
                          className={cn(
                            "line-clamp-1",
                            !isRead && "font-semibold",
                          )}
                        >
                          {item.title}
                        </ItemTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </ItemHeader>
                      <div className="flex items-start gap-2">
                        {!isRead ? (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        ) : null}
                        <ItemDescription className="line-clamp-2">
                          {item.body ?? "Open notification"}
                        </ItemDescription>
                        {item.href ? (
                          <button
                            type="button"
                            className="ml-auto inline-flex items-center self-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(item);
                            }}
                            aria-label="Go to notification"
                          >
                            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 [@media(hover:hover)]:group-hover:translate-x-0.5 transition-transform duration-150" />
                          </button>
                        ) : null}
                      </div>
                    </ItemContent>
                  </Item>
                </button>
              );
            })}
          </ItemGroup>
        ) : null}
      </ScrollArea>
    </div>
  );
}
