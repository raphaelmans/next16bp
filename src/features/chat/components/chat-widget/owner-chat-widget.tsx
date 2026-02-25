"use client";

import { useQueryOwnerOrganization } from "@/features/owner";
import { UnifiedChatInterface } from "../unified-chat/unified-chat-interface";

export function OwnerChatWidget() {
  const { isOwner, isLoading } = useQueryOwnerOrganization();

  if (isLoading || !isOwner) {
    return null;
  }

  return (
    <UnifiedChatInterface
      surface="floating"
      domain="reservation"
      reservationConfig={{
        kind: "owner",
        storageKeys: {
          open: "owner:chat:open",
          activeReservationThreadId: "owner:chat:activeReservationThreadId",
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
