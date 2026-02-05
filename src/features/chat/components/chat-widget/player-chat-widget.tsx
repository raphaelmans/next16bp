"use client";

import { ReservationInboxWidget } from "./reservation-inbox-widget";

export function PlayerChatWidget() {
  return (
    <ReservationInboxWidget
      config={{
        kind: "player",
        storageKeys: {
          open: "player:chat:open",
          activeReservationId: "player:chat:activeReservationId",
        },
        ui: {
          sheetTitle: "Messages",
          sheetDescription: "Reservation conversations",
          searchPlaceholder: "Search by venue or court…",
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
