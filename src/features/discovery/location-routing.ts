import { appRoutes } from "@/common/app-routes";

export type DiscoveryLocationRouteScope =
  | "none"
  | "province"
  | "city"
  | "sport";

export type DiscoveryLocationDefaults = {
  province?: string;
  city?: string;
  sportId?: string;
};

export type DiscoverySportRouteOption = {
  id: string;
  slug: string;
};

export const DISCOVERY_LOCATION_QUERY_KEYS = [
  "province",
  "city",
  "sportId",
] as const;

type DiscoveryLocationQueryKey = (typeof DISCOVERY_LOCATION_QUERY_KEYS)[number];

type RawSearchParams = Record<string, string | string[] | undefined>;

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const normalizeLocation = (input: DiscoveryLocationDefaults) => ({
  province: normalizeString(input.province),
  city: normalizeString(input.city),
  sportId: normalizeString(input.sportId),
});

export const getDiscoveryIgnoredLocationQueryKeys = (
  scope: DiscoveryLocationRouteScope,
): DiscoveryLocationQueryKey[] => {
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

export const sanitizeDiscoveryLocationSearchParams = (
  searchParams: RawSearchParams | undefined,
  scope: DiscoveryLocationRouteScope,
): RawSearchParams | undefined => {
  if (!searchParams) return searchParams;

  const ignoredKeys = new Set(getDiscoveryIgnoredLocationQueryKeys(scope));

  if (ignoredKeys.size === 0) {
    return searchParams;
  }

  return Object.fromEntries(
    Object.entries(searchParams).filter(
      ([key]) => !ignoredKeys.has(key as DiscoveryLocationQueryKey),
    ),
  );
};

export const buildDiscoveryLocationPath = (input: {
  location: DiscoveryLocationDefaults;
  sports?: DiscoverySportRouteOption[];
}) => {
  const location = normalizeLocation(input.location);

  if (!location.province) {
    return {
      pathname: appRoutes.courts.base,
      retainedLocationQuery: {} satisfies Partial<
        Record<DiscoveryLocationQueryKey, string>
      >,
    };
  }

  if (!location.city) {
    return {
      pathname: appRoutes.courts.locations.province(location.province),
      retainedLocationQuery: location.sportId
        ? ({ sportId: location.sportId } satisfies Partial<
            Record<DiscoveryLocationQueryKey, string>
          >)
        : ({} satisfies Partial<Record<DiscoveryLocationQueryKey, string>>),
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
      pathname: appRoutes.courts.locations.city(
        location.province,
        location.city,
      ),
      retainedLocationQuery: location.sportId
        ? ({ sportId: location.sportId } satisfies Partial<
            Record<DiscoveryLocationQueryKey, string>
          >)
        : ({} satisfies Partial<Record<DiscoveryLocationQueryKey, string>>),
    };
  }

  return {
    pathname: appRoutes.courts.locations.sport(
      location.province,
      location.city,
      matchedSport.slug,
    ),
    retainedLocationQuery: {} satisfies Partial<
      Record<DiscoveryLocationQueryKey, string>
    >,
  };
};

export const buildLegacyDiscoveryLocationRedirectPath = (input: {
  scope: DiscoveryLocationRouteScope;
  currentLocation: DiscoveryLocationDefaults;
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
        return appRoutes.courts.locations.sport(
          currentLocation.province,
          input.redirectedCity,
          input.redirectedSportSlug,
        );
      }

      return appRoutes.courts.locations.city(
        currentLocation.province,
        input.redirectedCity,
      );
    case "city":
      if (!currentLocation.city || !input.redirectedSportSlug) {
        return null;
      }

      return appRoutes.courts.locations.sport(
        currentLocation.province,
        currentLocation.city,
        input.redirectedSportSlug,
      );
    default:
      return null;
  }
};
