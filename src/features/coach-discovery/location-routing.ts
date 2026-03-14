import { appRoutes } from "@/common/app-routes";

export type CoachDiscoveryLocationRouteScope =
  | "none"
  | "province"
  | "city"
  | "sport";

export type CoachLocationDefaults = {
  province?: string;
  city?: string;
  sportId?: string;
};

export type CoachSportRouteOption = {
  id: string;
  slug: string;
};

export const COACH_DISCOVERY_LOCATION_QUERY_KEYS = [
  "province",
  "city",
  "sportId",
] as const;

type CoachDiscoveryLocationQueryKey =
  (typeof COACH_DISCOVERY_LOCATION_QUERY_KEYS)[number];

type RawSearchParams = Record<string, string | string[] | undefined>;

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const normalizeLocation = (input: CoachLocationDefaults) => ({
  province: normalizeString(input.province),
  city: normalizeString(input.city),
  sportId: normalizeString(input.sportId),
});

export const getCoachDiscoveryIgnoredLocationQueryKeys = (
  scope: CoachDiscoveryLocationRouteScope,
): CoachDiscoveryLocationQueryKey[] => {
  switch (scope) {
    case "province":
      return ["province", "city"];
    case "city":
    case "sport":
      return ["province", "city", "sportId"];
    default:
      return [];
  }
};

export const sanitizeCoachDiscoveryLocationSearchParams = (
  searchParams: RawSearchParams | undefined,
  scope: CoachDiscoveryLocationRouteScope,
): RawSearchParams | undefined => {
  if (!searchParams) {
    return searchParams;
  }

  const ignoredKeys = new Set(getCoachDiscoveryIgnoredLocationQueryKeys(scope));

  if (ignoredKeys.size === 0) {
    return searchParams;
  }

  return Object.fromEntries(
    Object.entries(searchParams).filter(
      ([key]) => !ignoredKeys.has(key as CoachDiscoveryLocationQueryKey),
    ),
  );
};

export const buildCoachDiscoveryLocationPath = (input: {
  location: CoachLocationDefaults;
  sports?: CoachSportRouteOption[];
}) => {
  const location = normalizeLocation(input.location);

  if (!location.province) {
    return {
      pathname: appRoutes.coaches.base,
      retainedLocationQuery: {} satisfies Partial<
        Record<CoachDiscoveryLocationQueryKey, string>
      >,
    };
  }

  if (!location.city) {
    return {
      pathname: appRoutes.coaches.locations.province(location.province),
      retainedLocationQuery: location.sportId
        ? ({ sportId: location.sportId } satisfies Partial<
            Record<CoachDiscoveryLocationQueryKey, string>
          >)
        : ({} satisfies Partial<
            Record<CoachDiscoveryLocationQueryKey, string>
          >),
    };
  }

  const matchedSport = location.sportId
    ? input.sports?.find(
        (sport) =>
          sport.id === location.sportId || sport.slug === location.sportId,
      )
    : undefined;

  if (!matchedSport) {
    return {
      pathname: appRoutes.coaches.locations.city(
        location.province,
        location.city,
      ),
      retainedLocationQuery: location.sportId
        ? ({ sportId: location.sportId } satisfies Partial<
            Record<CoachDiscoveryLocationQueryKey, string>
          >)
        : ({} satisfies Partial<
            Record<CoachDiscoveryLocationQueryKey, string>
          >),
    };
  }

  return {
    pathname: appRoutes.coaches.locations.sport(
      location.province,
      location.city,
      matchedSport.slug,
    ),
    retainedLocationQuery: {} satisfies Partial<
      Record<CoachDiscoveryLocationQueryKey, string>
    >,
  };
};

export const buildLegacyCoachDiscoveryLocationRedirectPath = (input: {
  scope: CoachDiscoveryLocationRouteScope;
  currentLocation: CoachLocationDefaults;
  redirectedCity?: string;
  redirectedSportSlug?: string;
}) => {
  const currentLocation = normalizeLocation(input.currentLocation);

  if (!currentLocation.province) {
    return null;
  }

  switch (input.scope) {
    case "province":
      if (!input.redirectedCity) {
        return null;
      }

      if (input.redirectedSportSlug) {
        return appRoutes.coaches.locations.sport(
          currentLocation.province,
          input.redirectedCity,
          input.redirectedSportSlug,
        );
      }

      return appRoutes.coaches.locations.city(
        currentLocation.province,
        input.redirectedCity,
      );
    case "city":
      if (!currentLocation.city || !input.redirectedSportSlug) {
        return null;
      }

      return appRoutes.coaches.locations.sport(
        currentLocation.province,
        currentLocation.city,
        input.redirectedSportSlug,
      );
    default:
      return null;
  }
};
