"use client";

import { MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { InboxFloatingSheetProps } from "./inbox-shell.types";

export function InboxFloatingSheet({
  open,
  onOpenChange,
  unreadCount,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
  sheetTitle,
  sheetDescription,
  isSmall,
  isDesktop,
  authLoading,
  authErrorMessage,
  clientErrorMessage,
  mobilePane,
  listPane,
  threadPane,
}: InboxFloatingSheetProps) {
  return (
    <div className="fixed bottom-[calc(5rem+max(0px,env(safe-area-inset-bottom)))] right-6 z-50 md:bottom-6">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <Button
          type="button"
          size="icon"
          variant={triggerVariant}
          className={cn(
            "relative h-12 w-12 rounded-full shadow-lg",
            triggerClassName,
          )}
          onClick={() => onOpenChange(true)}
        >
          <MessagesSquare className="h-5 w-5" />
          <span className="sr-only">{triggerLabel}</span>
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>

        <SheetContent
          side={isSmall ? "right" : "bottom"}
          className="flex h-[88vh] min-h-0 flex-col gap-0 overflow-hidden p-0 supports-[height:100dvh]:h-[88dvh] sm:h-full sm:max-w-5xl"
        >
          <div className="flex items-start justify-between border-b px-5 py-4">
            <div className="space-y-0.5">
              <SheetTitle className="font-heading">{sheetTitle}</SheetTitle>
              <SheetDescription className="text-xs">
                {sheetDescription}
              </SheetDescription>
            </div>
          </div>

          {authLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading chat…
            </div>
          ) : authErrorMessage ? (
            <div className="p-6 text-sm text-destructive">
              {authErrorMessage}
            </div>
          ) : clientErrorMessage ? (
            <div className="p-6 text-sm text-destructive">
              {clientErrorMessage}
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                isDesktop && "flex-row",
              )}
            >
              {(isDesktop || mobilePane === "list") && listPane}
              {isDesktop ? <Separator orientation="vertical" /> : null}
              {(isDesktop || mobilePane === "thread") && threadPane}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
