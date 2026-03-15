import {
  buildCoachDiscoveryLocationPath,
  type CoachSportRouteOption,
} from "@/features/coach-discovery/location-routing";

type NullableString = string | null | undefined;

type SharedCoachDiscoveryFilters = {
  q?: NullableString;
  province?: NullableString;
  city?: NullableString;
  sportId?: NullableString;
  sports?: CoachSportRouteOption[];
};

const normalizeString = (value: NullableString) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

export function buildCoachDiscoveryHrefFromCourtFilters(
  input: SharedCoachDiscoveryFilters,
): string {
  const q = normalizeString(input.q);
  const { pathname, retainedLocationQuery } = buildCoachDiscoveryLocationPath({
    location: {
      province: normalizeString(input.province),
      city: normalizeString(input.city),
      sportId: normalizeString(input.sportId),
    },
    sports: input.sports,
  });

  const searchParams = new URLSearchParams();

  if (q) {
    searchParams.set("q", q);
  }

  Object.entries(retainedLocationQuery).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function buildCoachDiscoveryEntryLabel(input: {
  locationLabel?: string | null;
  sportName?: string | null;
}) {
  if (input.sportName && input.locationLabel) {
    return `Explore ${input.sportName} coaches in ${input.locationLabel}`;
  }

  if (input.sportName) {
    return `Explore ${input.sportName} coaches`;
  }

  if (input.locationLabel) {
    return `Explore coaches in ${input.locationLabel}`;
  }

  return "Explore coaches";
}
