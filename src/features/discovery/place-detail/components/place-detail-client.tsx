"use client";

import PlaceDetailPageView from "@/features/discovery/place-detail/components/place-detail-page-view";

type PlaceDetailClientProps = {
  placeIdOrSlug: string;
};

export default function PlaceDetailPage({
  placeIdOrSlug,
}: PlaceDetailClientProps) {
  return <PlaceDetailPageView placeIdOrSlug={placeIdOrSlug} />;
}
