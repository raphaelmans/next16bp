"use client";

import { KudosLogo } from "@/components/kudos";

export function OwnerPortalBootLoader() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <KudosLogo size={56} variant="icon" className="animate-pulse" />
        <span className="sr-only">Loading organization workspace</span>
      </div>
    </div>
  );
}
