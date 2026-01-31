"use client";

import { useEffect } from "react";
import {
  useOwnerOnboardingIntent,
  useSetOwnerOnboardingIntent,
} from "@/common/hooks/owner-onboarding-intent";

export function OwnerOnboardingIntentClearer() {
  const { data: ownerOnboardingIntent } = useOwnerOnboardingIntent();
  const setOwnerOnboardingIntent = useSetOwnerOnboardingIntent();

  useEffect(() => {
    if (!ownerOnboardingIntent) {
      return;
    }

    setOwnerOnboardingIntent.mutate(false);
  }, [ownerOnboardingIntent, setOwnerOnboardingIntent]);

  return null;
}
