import type { Metadata } from "next";
import { appRoutes } from "@/common/app-routes";
import OpenPlayPlacePageView from "@/features/open-play/components/open-play-place-page-view";
import { env } from "@/lib/env";
import { getPlaceDetailsByIdOrSlug } from "@/lib/shared/lib/place-details.server";

type OpenPlayPlacePageParams = {
  placeId: string;
};

const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://kudoscourts.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<OpenPlayPlacePageParams>;
}): Promise<Metadata> {
  const { placeId } = await params;

  const canonicalPath = appRoutes.openPlay.byPlace(placeId);
  let title = "Open Play | KudosCourts";
  let description =
    "Browse upcoming Open Play sessions and join players near you.";

  try {
    const placeDetails = await getPlaceDetailsByIdOrSlug(placeId);
    const place = placeDetails.place;
    const canonicalPlaceId = place.slug ?? place.id;

    title = `Open Play at ${place.name} | KudosCourts`;
    description = `Browse upcoming Open Play sessions at ${place.name}. Join a game, meet players, and reserve your spot.`;

    return {
      title,
      description,
      metadataBase: new URL(appUrl),
      alternates: {
        canonical: appRoutes.openPlay.byPlace(canonicalPlaceId),
      },
      openGraph: {
        title,
        description,
        url: appRoutes.openPlay.byPlace(canonicalPlaceId),
        siteName: "KudosCourts",
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
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
}

export default function OpenPlayPlacePage() {
  return <OpenPlayPlacePageView />;
}
