"use client";

import { useCallback, useState } from "react";
import { useQueryOwnerSetupStatus } from "@/features/owner/hooks";
import { deriveSetupStatus } from "./get-started-helpers";
import type { OverlayStep } from "./get-started-types";

export function useModGetStartedOverlays() {
  const [activeOverlay, setActiveOverlay] = useState<OverlayStep>(null);

  const openOverlay = useCallback((step: NonNullable<OverlayStep>) => {
    setActiveOverlay(step);
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  return { activeOverlay, openOverlay, closeOverlay } as const;
}

export function useModGetStartedSetup() {
  const {
    data: raw,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQueryOwnerSetupStatus();

  const status = deriveSetupStatus(raw);

  return { status, isLoading, isFetching, error, refetch, raw } as const;
}
