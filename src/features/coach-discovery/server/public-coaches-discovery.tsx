import "server-only";

import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import CoachesPageClient from "@/features/coach-discovery/components/coaches-page-client";
import {
  buildLegacyCoachDiscoveryLocationRedirectPath,
  type CoachDiscoveryLocationRouteScope,
  type CoachLocationDefaults,
  sanitizeCoachDiscoveryLocationSearchParams,
} from "@/features/coach-discovery/location-routing";
import type {
  PublicCoachesPageData,
  PublicCoachResolvedLocation,
  PublicDiscoveryCoachCardMedia,
  PublicDiscoveryCoachSummary,
} from "@/features/coach-discovery/public-coaches-data";
import {
  buildCoachDiscoveryCacheTags,
  buildCoachListSummaryQueryInput,
  COACH_DISCOVERY_DEFAULT_LIMIT,
  COACH_DISCOVERY_REVALIDATE_SECONDS,
  type CoachListFilterState,
} from "@/features/coach-discovery/query-options";
import {
  COACH_AGE_GROUP_VALUES,
  COACH_SESSION_TYPE_VALUES,
  COACH_SKILL_LEVEL_VALUES,
} from "@/features/coach-discovery/schemas";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";
import { publicCaller } from "@/trpc/server";

type RawSearchParams = Record<string, string | string[] | undefined>;

const getFirstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseRating = (value?: string) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 5
    ? parsed
    : undefined;
};

const parseBoolean = (value?: string) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

const parseEnumValue = <TValue extends string>(
  value: string | undefined,
  allowedValues: readonly TValue[],
) => {
  if (!value) {
    return undefined;
  }

  return allowedValues.includes(value as TValue)
    ? (value as TValue)
    : undefined;
};

export const parseCoachDiscoverySearchParams = (
  searchParams?: RawSearchParams,
): CoachListFilterState => ({
  q: normalizeString(getFirstValue(searchParams?.q)),
  province: normalizeString(getFirstValue(searchParams?.province)),
  city: normalizeString(getFirstValue(searchParams?.city)),
  sportId: normalizeString(getFirstValue(searchParams?.sportId)),
  minRate:
    parsePositiveInt(getFirstValue(searchParams?.minRate), 0) || undefined,
  maxRate:
    parsePositiveInt(getFirstValue(searchParams?.maxRate), 0) || undefined,
  minRating: parseRating(getFirstValue(searchParams?.minRating)),
  skillLevel: parseEnumValue(
    normalizeString(getFirstValue(searchParams?.skillLevel)),
    COACH_SKILL_LEVEL_VALUES,
  ),
  ageGroup: parseEnumValue(
    normalizeString(getFirstValue(searchParams?.ageGroup)),
    COACH_AGE_GROUP_VALUES,
  ),
  sessionType: parseEnumValue(
    normalizeString(getFirstValue(searchParams?.sessionType)),
    COACH_SESSION_TYPE_VALUES,
  ),
  verified: parseBoolean(getFirstValue(searchParams?.verified)),
  page: parsePositiveInt(getFirstValue(searchParams?.page), 1),
  limit: parsePositiveInt(
    getFirstValue(searchParams?.limit),
    COACH_DISCOVERY_DEFAULT_LIMIT,
  ),
});

const resolveCoachLocation = async (
  provinceValue?: string,
  cityValue?: string,
): Promise<PublicCoachResolvedLocation> => {
  if (!provinceValue && !cityValue) {
    return {};
  }

  const provinces = await getPHProvincesCities();
  const resolved = resolveLocationSlugs(provinces, provinceValue, cityValue);

  return {
    provinceSlug: resolved.provinceSlug ?? normalizeString(provinceValue),
    citySlug: resolved.citySlug ?? normalizeString(cityValue),
    provinceName: resolved.province?.name ?? normalizeString(provinceValue),
    cityName: resolved.city?.name ?? normalizeString(cityValue),
  };
};

export const resolveCoachDiscoveryPrefetchState = async (input: {
  searchParams?: RawSearchParams;
  initialFilters?: CoachLocationDefaults;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
}) => {
  const parsedFilters = parseCoachDiscoverySearchParams(
    sanitizeCoachDiscoveryLocationSearchParams(
      input.searchParams,
      input.locationRouteScope ?? "none",
    ),
  );
  const effectiveFilters = {
    ...parsedFilters,
    province: parsedFilters.province ?? input.initialFilters?.province,
    city: parsedFilters.city ?? input.initialFilters?.city,
    sportId: parsedFilters.sportId ?? input.initialFilters?.sportId,
  };
  const resolvedLocation = await resolveCoachLocation(
    effectiveFilters.province,
    effectiveFilters.city,
  );

  return {
    effectiveFilters,
    resolvedLocation,
    summaryInput: buildCoachListSummaryQueryInput({
      ...effectiveFilters,
      province: resolvedLocation.provinceName,
      city: resolvedLocation.cityName,
    }),
  };
};

const toUrlSearchParams = (searchParams?: RawSearchParams) => {
  const next = new URLSearchParams();

  if (!searchParams) {
    return next;
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        next.append(key, entry);
      }
      continue;
    }

    if (value !== undefined) {
      next.set(key, value);
    }
  }

  return next;
};

const resolveCoachDiscoverySportSlug = async (sportValue?: string) => {
  const normalizedSport = normalizeString(sportValue);

  if (!normalizedSport) {
    return undefined;
  }

  const sports = await publicCaller.sport.list();

  return sports.find(
    (sport) => sport.id === normalizedSport || sport.slug === normalizedSport,
  )?.slug;
};

const resolveCoachDiscoveryLocationRedirect = async (input: {
  searchParams?: RawSearchParams;
  initialFilters?: CoachLocationDefaults;
  locationRoutePath?: string;
  locationRouteScope: CoachDiscoveryLocationRouteScope;
}) => {
  if (
    input.locationRouteScope === "none" ||
    !input.locationRoutePath ||
    !input.initialFilters?.province
  ) {
    return null;
  }

  const currentSearchParams = toUrlSearchParams(input.searchParams);
  const sanitizedSearchParams = toUrlSearchParams(
    sanitizeCoachDiscoveryLocationSearchParams(
      input.searchParams,
      input.locationRouteScope,
    ),
  );
  const queryProvince = normalizeString(
    getFirstValue(input.searchParams?.province),
  );
  const queryCity = normalizeString(getFirstValue(input.searchParams?.city));
  const querySportId = normalizeString(
    getFirstValue(input.searchParams?.sportId),
  );
  const hasIgnoredLocationQuery =
    queryProvince !== undefined ||
    queryCity !== undefined ||
    (input.locationRouteScope !== "province" && querySportId !== undefined);

  let redirectPath: string | null = null;

  if (input.locationRouteScope === "province" && queryCity) {
    const provinces = await getPHProvincesCities();
    const resolvedLocation = resolveLocationSlugs(
      provinces,
      input.initialFilters.province,
      queryCity,
    );
    const redirectedCity =
      resolvedLocation.provinceSlug === input.initialFilters.province
        ? (resolvedLocation.citySlug ?? undefined)
        : undefined;
    const redirectedSportSlug = redirectedCity
      ? await resolveCoachDiscoverySportSlug(querySportId)
      : undefined;

    redirectPath =
      buildLegacyCoachDiscoveryLocationRedirectPath({
        scope: input.locationRouteScope,
        currentLocation: input.initialFilters,
        redirectedCity,
        redirectedSportSlug,
      }) ?? null;
  } else if (input.locationRouteScope === "city" && input.initialFilters.city) {
    const redirectedSportSlug =
      await resolveCoachDiscoverySportSlug(querySportId);

    redirectPath =
      buildLegacyCoachDiscoveryLocationRedirectPath({
        scope: input.locationRouteScope,
        currentLocation: input.initialFilters,
        redirectedSportSlug,
      }) ?? null;
  }

  if (!redirectPath) {
    redirectPath = input.locationRoutePath;
  }

  if (!hasIgnoredLocationQuery && redirectPath === input.locationRoutePath) {
    return null;
  }

  const queryString = sanitizedSearchParams.toString();
  const redirectUrl = queryString
    ? `${redirectPath}?${queryString}`
    : redirectPath;
  const currentQueryString = currentSearchParams.toString();
  const currentUrl = currentQueryString
    ? `${input.locationRoutePath}?${currentQueryString}`
    : input.locationRoutePath;

  return redirectUrl === currentUrl ? null : redirectUrl;
};

const getCachedCoachSummaries = async (
  input: ReturnType<typeof buildCoachListSummaryQueryInput>,
  location: PublicCoachResolvedLocation,
) => {
  const cacheKey = JSON.stringify(input);
  const tags = buildCoachDiscoveryCacheTags(location);

  const cachedQuery = unstable_cache(
    async () => publicCaller.coach.listSummary(input),
    ["discovery", "coach-list-summary", cacheKey],
    {
      revalidate: COACH_DISCOVERY_REVALIDATE_SECONDS,
      tags,
    },
  );

  return cachedQuery();
};

const getCoachSummaries = async (
  input: ReturnType<typeof buildCoachListSummaryQueryInput>,
  location: PublicCoachResolvedLocation,
) => {
  if (input.q) {
    return publicCaller.coach.listSummary(input);
  }

  return getCachedCoachSummaries(input, location);
};

const getCachedCoachMedia = async (
  coachIds: string[],
  location: PublicCoachResolvedLocation,
) => {
  const cacheKey = JSON.stringify(coachIds);
  const tags = buildCoachDiscoveryCacheTags(location);

  const cachedQuery = unstable_cache(
    async () => publicCaller.coach.cardMediaByIds({ coachIds }),
    ["discovery", "coach-card-media", cacheKey],
    {
      revalidate: COACH_DISCOVERY_REVALIDATE_SECONDS,
      tags,
    },
  );

  return cachedQuery();
};

const getCoachMedia = async (
  coachIds: string[],
  location: PublicCoachResolvedLocation,
) => {
  if (coachIds.length === 0) {
    return [];
  }

  return getCachedCoachMedia(coachIds, location);
};

const getCoachStats = unstable_cache(
  async () => publicCaller.coach.stats(),
  ["discovery", "coach-stats"],
  {
    revalidate: COACH_DISCOVERY_REVALIDATE_SECONDS,
    tags: ["discovery:coaches:stats"],
  },
);

const mapSummaryItem = (item: {
  coach: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    city: string | null;
    province: string | null;
    baseHourlyRateCents: number | null;
    baseHourlyRateCurrency: string;
    featuredRank: number;
    provinceRank: number;
  };
  meta?: PublicDiscoveryCoachSummary["meta"];
}): PublicDiscoveryCoachSummary => ({
  id: item.coach.id,
  slug: item.coach.slug ?? undefined,
  name: item.coach.name,
  tagline: item.coach.tagline ?? undefined,
  city: item.coach.city ?? undefined,
  province: item.coach.province ?? undefined,
  baseHourlyRateCents: item.coach.baseHourlyRateCents ?? undefined,
  currency: item.coach.baseHourlyRateCurrency,
  featuredRank: item.coach.featuredRank,
  provinceRank: item.coach.provinceRank,
  meta: item.meta,
});

const mapMediaById = (
  items: {
    coachId: string;
    avatarUrl: string | null;
    primaryPhotoUrl: string | null;
  }[],
) =>
  Object.fromEntries(
    items.map((item) => [
      item.coachId,
      {
        avatarUrl: item.avatarUrl ?? undefined,
        primaryPhotoUrl: item.primaryPhotoUrl ?? undefined,
      } satisfies PublicDiscoveryCoachCardMedia,
    ]),
  );

const buildPublicCoachesPageData = async (args: {
  summaryInput: ReturnType<typeof buildCoachListSummaryQueryInput>;
  resolvedLocation: PublicCoachResolvedLocation;
  page: number;
}): Promise<PublicCoachesPageData> => {
  const [summaryResult, stats] = await Promise.all([
    getCoachSummaries(args.summaryInput, args.resolvedLocation),
    getCoachStats(),
  ]);
  const coaches = summaryResult.items.map(mapSummaryItem);
  const mediaItems = await getCoachMedia(
    coaches.map((coach) => coach.id),
    args.resolvedLocation,
  );

  return {
    coaches,
    mediaById: mapMediaById(mediaItems),
    stats,
    total: summaryResult.total,
    page: args.page,
    limit: args.summaryInput.limit,
    hasMore:
      args.summaryInput.offset + summaryResult.items.length <
      summaryResult.total,
  };
};

interface DiscoveryHydratedCoachesPageProps {
  initialFilters?: CoachLocationDefaults;
  initialLocationLabel?: string;
  locationRoutePath?: string;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
  searchParams?: RawSearchParams;
}

export async function DiscoveryHydratedCoachesPage({
  initialFilters,
  initialLocationLabel,
  locationRoutePath,
  locationRouteScope = "none",
  searchParams,
}: DiscoveryHydratedCoachesPageProps) {
  const redirectUrl = await resolveCoachDiscoveryLocationRedirect({
    searchParams,
    initialFilters,
    locationRoutePath,
    locationRouteScope,
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const { effectiveFilters, resolvedLocation, summaryInput } =
    await resolveCoachDiscoveryPrefetchState({
      searchParams,
      initialFilters,
      locationRouteScope,
    });

  const initialData = await buildPublicCoachesPageData({
    summaryInput,
    resolvedLocation,
    page: effectiveFilters.page ?? 1,
  });

  return (
    <CoachesPageClient
      initialData={initialData}
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
      locationRouteScope={locationRouteScope}
      initialResolvedLocation={resolvedLocation}
    />
  );
}
