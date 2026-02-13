"use client";

import type * as React from "react";
import type { Button } from "@/components/ui/button";
import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";

type SupportChatKind = "claim" | "verification";

export function SupportChatSheet({
  kind,
  requestId,
  triggerLabel = "Message admin",
  triggerVariant = "outline",
  triggerSize,
}: {
  kind: SupportChatKind;
  requestId: string;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <UnifiedChatInterface
      surface="sheet"
      domain="support"
      kind={kind}
      requestId={requestId}
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
    />
  );
}
