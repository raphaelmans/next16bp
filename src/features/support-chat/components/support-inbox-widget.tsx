"use client";

import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";

export function SupportInboxWidget() {
  return <UnifiedChatInterface surface="floating" domain="support" />;
}
