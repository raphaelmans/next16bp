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
          sheetDescription:
            "Chat with venue staff about payment details and booking confirmation",
        },
        labels: {
          listPrimary: (meta) => (meta ? meta.placeName : null),
          listSecondary: (meta) =>
            meta ? `Venue: ${meta.ownerDisplayName}` : null,
          threadTitle: (meta) => meta?.placeName ?? "Messages",
        },
      }}
    />
  );
}
