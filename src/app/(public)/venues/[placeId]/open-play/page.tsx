import type { Metadata } from "next";
import {
  generateOpenPlayPlaceMetadata,
  OpenPlayPlacePage,
} from "@/features/open-play/pages/open-play-place-page";

type OpenPlayVenueRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export async function generateMetadata({
  params,
}: OpenPlayVenueRoutePageProps): Promise<Metadata> {
  const { placeId } = await params;
  return generateOpenPlayPlaceMetadata(placeId);
}

export default async function OpenPlayVenueRoutePage({
  params,
}: OpenPlayVenueRoutePageProps) {
  const { placeId } = await params;
  return <OpenPlayPlacePage placeIdOrSlug={placeId} />;
}
