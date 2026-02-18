import type { Metadata } from "next";
import {
  generateOpenPlayPlaceMetadata,
  OpenPlayPlacePage,
} from "@/features/open-play/pages/open-play-place-page";

type OpenPlayPlaceRoutePageProps = {
  params: Promise<{ placeId: string }>;
};

export async function generateMetadata({
  params,
}: OpenPlayPlaceRoutePageProps): Promise<Metadata> {
  const { placeId } = await params;
  return generateOpenPlayPlaceMetadata(placeId);
}

export default async function OpenPlayPlaceRoutePage({
  params,
}: OpenPlayPlaceRoutePageProps) {
  const { placeId } = await params;
  return <OpenPlayPlacePage placeIdOrSlug={placeId} />;
}
