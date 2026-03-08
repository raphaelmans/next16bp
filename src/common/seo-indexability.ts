import { isSeoIndexableSlug } from "@/common/seo-slug-filter";

const GENERIC_SEO_SLUGS = new Set([
  "venue",
  "venues",
  "my-venue",
  "organization",
  "my-organization",
  "court",
  "courts",
  "my-court",
  "pickleball-court",
  "pickleball-courts",
  "badminton-court",
  "badminton-courts",
  "basketball-court",
  "basketball-courts",
  "tennis-court",
  "tennis-courts",
]);

const GENERIC_SEO_NAME_PATTERNS = [
  /^(my|your)\s+(venue|organization|court|courts)$/i,
  /^(venue|organization|court|courts)$/i,
  /^(pickleball|badminton|basketball|tennis)\s+court(s)?$/i,
];

const normalizeText = (value?: string | null) => value?.trim() ?? "";

const hasText = (value?: string | null) => normalizeText(value).length > 0;

export function isLikelyGenericSeoSlug(slug?: string | null): boolean {
  const normalized = normalizeText(slug).toLowerCase();
  if (!normalized) {
    return true;
  }

  if (GENERIC_SEO_SLUGS.has(normalized)) {
    return true;
  }

  return /^(my|your)-(venue|organization|court|courts)$/.test(normalized);
}

export function isLikelyGenericSeoName(name?: string | null): boolean {
  const normalized = normalizeText(name);
  if (!normalized) {
    return true;
  }

  return GENERIC_SEO_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

export type PlaceSeoIndexabilityInput = {
  slug?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  activeCourtCount: number;
  photoCount?: number;
  hasContactDetails?: boolean;
  verificationStatus?:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | null;
};

export function isSeoIndexablePlaceSurface(
  input: PlaceSeoIndexabilityInput,
): boolean {
  const slug = normalizeText(input.slug);
  const hasRequiredLocation =
    hasText(input.address) && hasText(input.city) && hasText(input.province);
  const hasTrustSignal =
    (input.photoCount ?? 0) > 0 ||
    Boolean(input.hasContactDetails) ||
    input.verificationStatus === "VERIFIED";

  return (
    Boolean(slug) &&
    isSeoIndexableSlug(slug) &&
    !isLikelyGenericSeoSlug(slug) &&
    !isLikelyGenericSeoName(input.name) &&
    hasRequiredLocation &&
    input.activeCourtCount > 0 &&
    hasTrustSignal
  );
}

export type OrganizationSeoIndexabilityInput = {
  slug?: string | null;
  name?: string | null;
  venueCount: number;
  totalCourts: number;
  hasProfileContent: boolean;
};

export function isSeoIndexableOrganizationSurface(
  input: OrganizationSeoIndexabilityInput,
): boolean {
  const slug = normalizeText(input.slug);

  return (
    Boolean(slug) &&
    isSeoIndexableSlug(slug) &&
    !isLikelyGenericSeoSlug(slug) &&
    !isLikelyGenericSeoName(input.name) &&
    input.venueCount > 0 &&
    input.totalCourts > 0 &&
    input.hasProfileContent
  );
}
