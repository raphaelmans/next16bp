"use client";

import Link from "next/link";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface OpenPlayCardProps {
  openPlay: {
    id: string;
    startsAtIso: string;
    endsAtIso: string;
    title: string | null;
    joinPolicy: "REQUEST" | "AUTO";
    maxPlayers: number;
    confirmedCount: number;
    availableSpots: number;
    costSharing: {
      currency: string;
      suggestedSplitPerPlayerCents: number;
      requiresPayment: boolean;
    };
    courtLabel: string;
    sportName: string;
    host: {
      displayName: string;
      avatarUrl: string | null;
    };
  };
  timeZone: string;
  href: string;
  className?: string;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function OpenPlayCard({
  openPlay,
  timeZone,
  href,
  className,
}: OpenPlayCardProps) {
  const subtitle = `${openPlay.sportName} • ${openPlay.courtLabel}`;
  const dateLabel = formatInTimeZone(
    openPlay.startsAtIso,
    timeZone,
    "EEE MMM d",
  );
  const timeLabel = formatTimeRangeInTimeZone(
    openPlay.startsAtIso,
    openPlay.endsAtIso,
    timeZone,
  );

  const spotsLabel =
    openPlay.availableSpots === 0
      ? "Full"
      : `${openPlay.availableSpots} spot${openPlay.availableSpots === 1 ? "" : "s"} left`;
  const suggestedSplitLabel = `${formatCurrency(
    openPlay.costSharing.suggestedSplitPerPlayerCents,
    openPlay.costSharing.currency,
  )}/player`;

  return (
    <Link href={href} className={cn("block", className)}>
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-heading font-semibold">
                  {openPlay.title || "Open Play"}
                </h3>
                <Badge
                  variant={
                    openPlay.joinPolicy === "AUTO" ? "secondary" : "outline"
                  }
                >
                  {openPlay.joinPolicy === "AUTO" ? "Auto-join" : "Request"}
                </Badge>
                {openPlay.costSharing.requiresPayment ? (
                  <Badge variant="secondary" className="text-[11px]">
                    Est. {suggestedSplitLabel}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-medium">{dateLabel}</span>
                <span className="text-muted-foreground"> · {timeLabel}</span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge
                variant={
                  openPlay.availableSpots === 0 ? "destructive" : "default"
                }
              >
                {spotsLabel}
              </Badge>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={openPlay.host.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initials(openPlay.host.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground max-w-[140px] truncate">
                  {openPlay.host.displayName}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
