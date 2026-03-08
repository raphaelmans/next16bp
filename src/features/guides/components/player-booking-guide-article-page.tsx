"use client";

import { InteractiveGuideArticlePage } from "@/features/guides/components/interactive-guide-article-page";
import { PLAYER_BOOKING_GUIDE_SECTIONS } from "@/features/guides/components/player-booking-guide-content";
import { getPlayerGuideSnippetForSection } from "@/features/guides/components/player-booking-guide-snippets";

export function PlayerBookingGuideArticlePage({
  header,
  footer,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <InteractiveGuideArticlePage
      sections={PLAYER_BOOKING_GUIDE_SECTIONS}
      getSnippetForSection={getPlayerGuideSnippetForSection}
      header={header}
      footer={footer}
    />
  );
}
