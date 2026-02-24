"use client";

import { UnifiedChatInterface } from "../unified-chat/unified-chat-interface";

export function PlayerChatWidget() {
  return (
    <UnifiedChatInterface
      surface="floating"
      domain="reservation"
      reservationConfig={{
        kind: "player",
        storageKeys: {
          open: "player:chat:open",
          activeReservationThreadId: "player:chat:activeReservationThreadId",
        },
        ui: {
          sheetTitle: "Messages",
          sheetDescription: "Reservation conversations",
        },
        labels: {
          listPrimary: (meta) => (meta ? meta.placeName : null),
          listSecondary: () => null,
          threadTitle: (meta) => meta?.placeName ?? "Messages",
        },
      }}
    />
  );
}
