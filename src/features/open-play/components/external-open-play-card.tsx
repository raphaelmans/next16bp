"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ExternalOpenPlayCardProps {
  externalOpenPlay: {
    id: string;
    startsAtIso: string;
    endsAtIso: string;
    title: string | null;
    courtLabel: string | null;
    joinPolicy: "REQUEST" | "AUTO";
    maxPlayers: number;
    confirmedCount: number;
    availableSpots: number;
    sportName: string;
    sourcePlatform: "RECLUB" | "OTHER";
    reportCount: number;
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

export function ExternalOpenPlayCard({
  externalOpenPlay,
  timeZone,
  href,
  className,
}: ExternalOpenPlayCardProps) {
  const subtitle = `${externalOpenPlay.sportName} • ${externalOpenPlay.courtLabel ?? "Court TBD"}`;
  const dateLabel = formatInTimeZone(
    externalOpenPlay.startsAtIso,
    timeZone,
    "EEE MMM d",
  );
  const timeLabel = formatTimeRangeInTimeZone(
    externalOpenPlay.startsAtIso,
    externalOpenPlay.endsAtIso,
    timeZone,
  );

  const spotsLabel =
    externalOpenPlay.availableSpots === 0
      ? "Full"
      : `${externalOpenPlay.availableSpots} spot${externalOpenPlay.availableSpots === 1 ? "" : "s"} left`;

  return (
    <Link href={href} className={cn("block", className)}>
      <Card className="border-amber-500/30 bg-amber-500/5 transition-colors hover:bg-amber-500/10">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-heading font-semibold">
                  {externalOpenPlay.title || "External Open Play"}
                </h3>
                <Badge variant="outline">Unverified</Badge>
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
                  externalOpenPlay.availableSpots === 0
                    ? "destructive"
                    : "default"
                }
              >
                {spotsLabel}
              </Badge>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={externalOpenPlay.host.avatarUrl ?? undefined}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials(externalOpenPlay.host.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                  {externalOpenPlay.host.displayName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              External listing from{" "}
              {externalOpenPlay.sourcePlatform === "RECLUB"
                ? "Reclub"
                : "another platform"}
              . Schedule is not verified by the venue.
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
