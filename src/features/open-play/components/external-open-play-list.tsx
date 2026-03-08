"use client";

import { ExternalOpenPlayCard } from "./external-open-play-card";

export function ExternalOpenPlayList({
  items,
  timeZone,
  hrefFor,
}: {
  items: Array<{
    id: string;
    startsAtIso: string;
    endsAtIso: string;
    title: string | null;
    courtSummaryLabel: string | null;
    courts: Array<{
      label: string;
    }>;
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
  }>;
  timeZone: string;
  hrefFor: (externalOpenPlayId: string) => string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ExternalOpenPlayCard
          key={item.id}
          externalOpenPlay={item}
          timeZone={timeZone}
          href={hrefFor(item.id)}
        />
      ))}
    </div>
  );
}
