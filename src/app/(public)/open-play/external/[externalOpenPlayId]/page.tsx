import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { ExternalOpenPlayDetailPage as ExternalOpenPlayDetailFeaturePage } from "@/features/open-play/pages/external-open-play-detail-page";
import { env } from "@/lib/env";
import { getExternalOpenPlayPublicDetail } from "@/lib/modules/open-play/server/external-open-play-public-detail";

type ExternalOpenPlayDetailRouteParams = {
  externalOpenPlayId: string;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<ExternalOpenPlayDetailRouteParams>;
}): Promise<Metadata> {
  const { externalOpenPlayId } = await params;

  const canonicalPath = appRoutes.openPlay.externalDetail(externalOpenPlayId);
  let title = "External Open Play | KudosCourts";
  let description =
    "Join unverified external open play sessions and connect with nearby players.";

  try {
    const detail = await getExternalOpenPlayPublicDetail(externalOpenPlayId);
    const dateLabel = formatInTimeZone(
      detail.externalOpenPlay.startsAtIso,
      detail.place.timeZone,
      "EEE MMM d",
    );
    const timeLabel = formatTimeRangeInTimeZone(
      detail.externalOpenPlay.startsAtIso,
      detail.externalOpenPlay.endsAtIso,
      detail.place.timeZone,
    );
    const spotsLeft = detail.externalOpenPlay.availableSpots;
    const spotsLabel =
      spotsLeft === 0
        ? "Session is full."
        : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`;
    const sourceLabel =
      detail.externalOpenPlay.sourcePlatform === "RECLUB"
        ? "Reclub"
        : "external booking";

    title = `External Open Play: ${detail.sport.name} at ${detail.place.name} (${dateLabel} ${timeLabel}) | KudosCourts`;
    description = `Unverified session from ${sourceLabel} at ${detail.place.name}. ${spotsLabel}`;
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

export default async function ExternalOpenPlayDetailRoutePage({
  params,
}: {
  params: Promise<ExternalOpenPlayDetailRouteParams>;
}) {
  const { externalOpenPlayId } = await params;
  return (
    <ExternalOpenPlayDetailFeaturePage
      externalOpenPlayId={externalOpenPlayId}
    />
  );
}
