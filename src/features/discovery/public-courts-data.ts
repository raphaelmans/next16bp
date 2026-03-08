import type { DiscoveryAvailabilityPreview } from "@/features/discovery/query-options";

export interface PublicDiscoveryPlaceCardMeta {
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
  hasPaymentMethods?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export interface PublicDiscoveryPlaceCardMedia {
  coverImageUrl?: string;
  organizationLogoUrl?: string;
}

export interface PublicDiscoveryPlaceSummary {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  placeType?: "CURATED" | "RESERVABLE";
  featuredRank?: number;
  provinceRank?: number;
  latitude?: number;
  longitude?: number;
  availabilityPreview?: DiscoveryAvailabilityPreview;
  meta?: PublicDiscoveryPlaceCardMeta;
}

export interface PublicCourtsPageData {
  places: PublicDiscoveryPlaceSummary[];
  mediaById: Record<string, PublicDiscoveryPlaceCardMedia>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
