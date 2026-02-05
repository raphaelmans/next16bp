"use client";

import { ReservationInboxWidget } from "./reservation-inbox-widget";

export function OwnerChatWidget() {
  return (
    <ReservationInboxWidget
      config={{
        kind: "owner",
        storageKeys: {
          open: "owner:chat:open",
          activeReservationId: "owner:chat:activeReservationId",
        },
        ui: {
          sheetTitle: "Inbox",
          sheetDescription: "Reservation messages across your venues",
          searchPlaceholder: "Search by player, venue, or court…",
        },
        labels: {
          listPrimary: (meta) => (meta ? meta.playerDisplayName : null),
          listSecondary: () => null,
          threadTitle: (meta) => meta?.playerDisplayName ?? "Messages",
        },
      }}
    />
  );
}
