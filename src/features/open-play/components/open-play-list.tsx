"use client";

import { OpenPlayCard } from "./open-play-card";

export function OpenPlayList({
  items,
  timeZone,
  hrefFor,
}: {
  items: Array<{
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
  }>;
  timeZone: string;
  hrefFor: (openPlayId: string) => string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <OpenPlayCard
          key={item.id}
          openPlay={item}
          timeZone={timeZone}
          href={hrefFor(item.id)}
        />
      ))}
    </div>
  );
}
