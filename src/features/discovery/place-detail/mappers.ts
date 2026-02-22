import type { PlaceDetail } from "@/features/discovery/hooks/place-detail";
import type { RouterOutputs } from "@/trpc/types";

type PlaceDetailsResponse = RouterOutputs["place"]["getByIdOrSlug"];

const toFiniteNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number.parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function mapPlaceDetailsToPlaceDetail(
  response: PlaceDetailsResponse,
): PlaceDetail {
  const courts: PlaceDetail["courts"] = response.courts.map((court) => ({
    id: court.court.id,
    label: court.court.label,
    sportId: court.sport.id,
    sportName: court.sport.name,
    tierLabel: court.court.tierLabel ?? undefined,
    isActive: court.court.isActive,
  }));

  const photos: PlaceDetail["photos"] = response.photos.map((photo, index) => ({
    id: photo.id,
    url: photo.url,
    alt: `${response.place.name} photo ${index + 1}`,
  }));

  const contactDetail: PlaceDetail["contactDetail"] = response.contactDetail
    ? {
        websiteUrl: response.contactDetail.websiteUrl ?? undefined,
        facebookUrl: response.contactDetail.facebookUrl ?? undefined,
        instagramUrl: response.contactDetail.instagramUrl ?? undefined,
        phoneNumber: response.contactDetail.phoneNumber ?? undefined,
        viberInfo: response.contactDetail.viberInfo ?? undefined,
        otherContactInfo: response.contactDetail.otherContactInfo ?? undefined,
      }
    : undefined;

  return {
    id: response.place.id,
    slug: response.place.slug ?? undefined,
    name: response.place.name,
    address: response.place.address,
    city: response.place.city,
    latitude: toFiniteNumber(response.place.latitude),
    longitude: toFiniteNumber(response.place.longitude),
    extGPlaceId: response.place.extGPlaceId ?? undefined,
    timeZone: response.place.timeZone,
    description: undefined,
    coverImageUrl: photos[0]?.url,
    logoUrl: response.organizationLogoUrl ?? undefined,
    courts,
    photos,
    sports: response.sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      slug: sport.slug ?? undefined,
    })),
    placeType: response.place.placeType,
    claimStatus: response.place.claimStatus,
    verification: response.verification
      ? {
          status: response.verification.status as
            | "UNVERIFIED"
            | "PENDING"
            | "VERIFIED"
            | "REJECTED",
          reservationsEnabled: response.verification.reservationsEnabled,
        }
      : null,
    contactDetail,
    amenities: response.amenities
      .map((amenity) => amenity.name)
      .filter((name): name is string => Boolean(name)),
  };
}
