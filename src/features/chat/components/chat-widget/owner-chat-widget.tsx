"use client";

import { useOwnerOrganization } from "@/features/owner";
import { ReservationInboxWidget } from "./reservation-inbox-widget";

export function OwnerChatWidget() {
  const { isOwner, isLoading } = useOwnerOrganization();

  if (isLoading || !isOwner) {
    return null;
  }

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
