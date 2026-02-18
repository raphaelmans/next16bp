"use client";

import { useFeatureMutation } from "@/common/feature-api-hooks";
import { getContactApi } from "./api.runtime";

const contactApi = getContactApi();

// ============================================================================
// From use-submit-contact-message.ts
// ============================================================================

export function useMutSubmitContactMessage() {
  return useFeatureMutation(contactApi.mutContactSubmit);
}
