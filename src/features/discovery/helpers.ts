import type { PlaceCardPlace } from "@/components/kudos";

export interface PlaceSummary extends PlaceCardPlace {
  latitude?: number;
  longitude?: number;
}

interface PlaceListItem {
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    placeType?: "CURATED" | "RESERVABLE";
    featuredRank?: number | null;
  };
  coverImageUrl?: string | null;
  organizationLogoUrl?: string | null;
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string | null;
  verificationStatus?:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | null;
  reservationsEnabled?: boolean | null;
}

export type PlaceVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type PlaceType = "CURATED" | "RESERVABLE";

export interface PlaceVerificationDisplayInput {
  placeType?: PlaceType | null;
  verificationStatus?: PlaceVerificationStatus | null;
  reservationsEnabled?: boolean | null;
}

export interface PlaceVerificationDisplay {
  isBookable: boolean;
  isCurated: boolean;
  isVerified: boolean;
  showBooking: boolean;
  showVerificationBadge: boolean;
  showBookingVerificationUi: boolean;
  verificationMessage: string;
}

export function getPlaceVerificationDisplay(
  input: PlaceVerificationDisplayInput,
): PlaceVerificationDisplay {
  const placeType = input.placeType ?? null;
  const verificationStatus = input.verificationStatus ?? "UNVERIFIED";
  const reservationsEnabled = input.reservationsEnabled ?? false;

  const isBookable = placeType === "RESERVABLE";
  const isCurated = placeType === "CURATED";
  const isVerified = verificationStatus === "VERIFIED";
  const showBooking = isBookable && isVerified && reservationsEnabled;
  const showVerificationBadge = showBooking;
  const showBookingVerificationUi = !showBooking && !isCurated;

  const verificationMessage = showBooking
    ? "Verified for reservations"
    : verificationStatus === "PENDING"
      ? "Verification pending"
      : verificationStatus === "REJECTED"
        ? "Verification needs updates"
        : "Verification required to book";

  return {
    isBookable,
    isCurated,
    isVerified,
    showBooking,
    showVerificationBadge,
    showBookingVerificationUi,
    verificationMessage,
  };
}

export const mapPlaceSummary = (item: PlaceListItem): PlaceSummary => {
  const latitude = Number.parseFloat(item.place.latitude ?? "");
  const longitude = Number.parseFloat(item.place.longitude ?? "");

  return {
    id: item.place.id,
    slug: item.place.slug ?? undefined,
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    coverImageUrl: item.coverImageUrl ?? undefined,
    logoUrl: item.organizationLogoUrl ?? undefined,
    sports: item.sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
    })),
    courtCount: item.courtCount,
    lowestPriceCents: item.lowestPriceCents,
    currency: item.currency ?? undefined,
    placeType: item.place.placeType,
    verificationStatus: item.verificationStatus ?? undefined,
    reservationsEnabled: item.reservationsEnabled ?? undefined,
    featuredRank: item.place.featuredRank ?? 0,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};
