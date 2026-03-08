import "server-only";

import { cache } from "react";
import { mapPlaceDetailsToPlaceDetail } from "@/features/discovery/place-detail/mappers";
import type { PlaceDetails } from "@/lib/modules/place/services/place-discovery.service";
import { publicCaller } from "@/trpc/server";

type PlaceDetailsResponse = PlaceDetails;

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
  const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
  return {
    courts: coreData.place.courts,
  };
}

export type PlaceVenueSectionData = {
  placeId: string;
  placeSlug: string;
  placeName: string;
  photos: ReturnType<typeof mapPlaceDetailsToPlaceDetail>["photos"];
  contactDetail: ReturnType<
    typeof mapPlaceDetailsToPlaceDetail
  >["contactDetail"];
  amenities: ReturnType<typeof mapPlaceDetailsToPlaceDetail>["amenities"];
};

export async function getPlaceVenueSectionData(
  placeIdOrSlug: string,
): Promise<PlaceVenueSectionData> {
  const coreData = await getPlaceCoreSectionData(placeIdOrSlug);
  const place = coreData.place;
  return {
    placeId: coreData.placeDetails.place.id,
    placeSlug:
      coreData.placeDetails.place.slug ?? coreData.placeDetails.place.id,
    placeName: place.name,
    photos: place.photos,
    contactDetail: place.contactDetail,
    amenities: place.amenities,
  };
}
