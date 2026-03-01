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
        kind: "organization",
        storageKeys: {
          open: "owner:chat:open",
          activeReservationThreadId: "owner:chat:activeReservationThreadId",
        },
        ui: {
          sheetTitle: "Inbox",
          sheetDescription:
            "New bookings, payment updates, and player follow-ups across your venues",
        },
        labels: {
          listPrimary: (meta) => (meta ? meta.playerDisplayName : null),
          listSecondary: (meta) => (meta ? meta.placeName : null),
          threadTitle: (meta) => meta?.playerDisplayName ?? "Messages",
        },
      }}
    />
  );
}
