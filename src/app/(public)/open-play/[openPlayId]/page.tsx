import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { OpenPlayDetailPage as OpenPlayDetailFeaturePage } from "@/features/open-play/pages/open-play-detail-page";
import { getOpenPlayPublicDetail } from "@/lib/modules/open-play/server/open-play-public-detail";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type OpenPlayDetailPageParams = {
  openPlayId: string;
};

const appUrl = getCanonicalOrigin();

export async function generateMetadata({
  params,
}: {
  params: Promise<OpenPlayDetailPageParams>;
}): Promise<Metadata> {
  const { openPlayId } = await params;

  const canonicalPath = appRoutes.openPlay.detail(openPlayId);
  let title = "Open Play | KudosCourts";
  let description =
    "Join an Open Play session on KudosCourts and play with other nearby players.";

  try {
    const detail = await getOpenPlayPublicDetail(openPlayId);
    const dateLabel = formatInTimeZone(
      detail.openPlay.startsAtIso,
      detail.place.timeZone,
      "EEE MMM d",
    );
    const timeLabel = formatTimeRangeInTimeZone(
      detail.openPlay.startsAtIso,
      detail.openPlay.endsAtIso,
      detail.place.timeZone,
    );
    const spotsLeft = detail.openPlay.availableSpots;
    const spotsLabel =
      spotsLeft === 0
        ? "Session is full."
        : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`;

    title = `Open Play: ${detail.sport.name} at ${detail.place.name} (${dateLabel} ${timeLabel}) | KudosCourts`;

    description = `Join an Open Play at ${detail.place.name}. ${spotsLabel}`;
    if (detail.costSharing.requiresPayment) {
      description += ` Suggested split: ${formatCurrency(
        detail.costSharing.suggestedSplitPerPlayerCents,
        detail.costSharing.currency,
      )} per player.`;
    }
  } catch {
    // Keep fallback metadata for hidden/unavailable sessions.
  }

  return {
    title,
    description,
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "KudosCourts",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function OpenPlayDetailPage({
  params,
}: {
  params: Promise<OpenPlayDetailPageParams>;
}) {
  const { openPlayId } = await params;
  return <OpenPlayDetailFeaturePage openPlayId={openPlayId} />;
}
