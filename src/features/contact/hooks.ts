"use client";

import { trpc } from "@/trpc/client";

// ============================================================================
// From use-submit-contact-message.ts
// ============================================================================

export function useSubmitContactMessage() {
  return trpc.contact.submit.useMutation();
}
