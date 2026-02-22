import "server-only";

import { cache } from "react";
import { mapPlaceDetailsToPlaceDetail } from "@/features/discovery/place-detail/mappers";
import { publicCaller } from "@/trpc/server";
import type { RouterOutputs } from "@/trpc/types";

type PlaceDetailsResponse = RouterOutputs["place"]["getByIdOrSlug"];

const getPlaceDetailsByIdOrSlugUncached = async (placeIdOrSlug: string) =>
  publicCaller.place.getByIdOrSlug({ placeIdOrSlug });

const getPlaceDetailsByIdOrSlugCached = cache(
  getPlaceDetailsByIdOrSlugUncached,
);

export type PlaceCoreSectionData = {
  placeDetails: PlaceDetailsResponse;
  place: ReturnType<typeof mapPlaceDetailsToPlaceDetail>;
};

export async function getPlaceCoreSectionData(
  placeIdOrSlug: string,
): Promise<PlaceCoreSectionData> {
  const placeDetails = await getPlaceDetailsByIdOrSlugCached(placeIdOrSlug);
  return {
    placeDetails,
    place: mapPlaceDetailsToPlaceDetail(placeDetails),
  };
}

export type PlaceCourtsSectionData = {
  courts: ReturnType<typeof mapPlaceDetailsToPlaceDetail>["courts"];
};

export async function getPlaceCourtsSectionData(
  placeIdOrSlug: string,
): Promise<PlaceCourtsSectionData> {
  const placeDetails = await getPlaceDetailsByIdOrSlugUncached(placeIdOrSlug);
  return {
    courts: mapPlaceDetailsToPlaceDetail(placeDetails).courts,
  };
}

export type PlaceVenueSectionData = {
  contactDetail: ReturnType<
    typeof mapPlaceDetailsToPlaceDetail
  >["contactDetail"];
  amenities: ReturnType<typeof mapPlaceDetailsToPlaceDetail>["amenities"];
};

export async function getPlaceVenueSectionData(
  placeIdOrSlug: string,
): Promise<PlaceVenueSectionData> {
  const placeDetails = await getPlaceDetailsByIdOrSlugUncached(placeIdOrSlug);
  const place = mapPlaceDetailsToPlaceDetail(placeDetails);
  return {
    contactDetail: place.contactDetail,
    amenities: place.amenities,
  };
}
