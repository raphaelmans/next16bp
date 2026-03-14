"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useCallback, useTransition } from "react";
import { requestSkipNextRouteScroll } from "@/common/providers/route-scroll-manager";
import {
  buildCoachDiscoveryLocationPath,
  type CoachDiscoveryLocationRouteScope,
  type CoachLocationDefaults,
  type CoachSportRouteOption,
} from "../location-routing";
import type { CoachSearchParams } from "../schemas";
import { coachSearchParamsSchema } from "../schemas";

type CoachFiltersPatch = Partial<CoachSearchParams>;

const hasOwn = <T extends object>(value: T, key: keyof CoachSearchParams) =>
  Object.hasOwn(value, key);

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const normalizeInteger = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : null;

const normalizeRating = (value?: number | null) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 5
    ? value
    : null;

const serializeValue = (
  params: URLSearchParams,
  key: keyof CoachSearchParams,
  value: CoachSearchParams[keyof CoachSearchParams] | null | undefined,
) => {
  params.delete(key);

  if (value === null || value === undefined) {
    return;
  }

  if (key === "page" && value === 1) {
    return;
  }

  if (key === "limit" && value === 12) {
    return;
  }

  params.set(key, String(value));
};

const normalizeLocationValue = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

type UseModCoachDiscoveryFiltersOptions = {
  initialFilters?: CoachLocationDefaults;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
  sports?: CoachSportRouteOption[];
};

export function useModCoachDiscoveryFilters(
  options: UseModCoachDiscoveryFiltersOptions = {},
) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(coachSearchParamsSchema, {
    scroll: false,
    shallow: false,
    startTransition,
  });
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationRouteScope = options.locationRouteScope ?? "none";
  const hasPathBackedLocationScope = locationRouteScope !== "none";

  const commitFilters = useCallback(
    (patch: CoachFiltersPatch) => {
      const nextPatch: CoachFiltersPatch = {};

      if (hasOwn(patch, "q")) {
        nextPatch.q = normalizeString(patch.q);
      }
      if (hasOwn(patch, "province")) {
        nextPatch.province = normalizeString(patch.province);
      }
      if (hasOwn(patch, "city")) {
        nextPatch.city = normalizeString(patch.city);
      }
      if (hasOwn(patch, "sportId")) {
        nextPatch.sportId = normalizeString(patch.sportId);
      }
      if (hasOwn(patch, "minRate")) {
        nextPatch.minRate = normalizeInteger(patch.minRate);
      }
      if (hasOwn(patch, "maxRate")) {
        nextPatch.maxRate = normalizeInteger(patch.maxRate);
      }
      if (hasOwn(patch, "minRating")) {
        nextPatch.minRating = normalizeRating(patch.minRating);
      }
      if (hasOwn(patch, "skillLevel")) {
        nextPatch.skillLevel = patch.skillLevel ?? null;
      }
      if (hasOwn(patch, "ageGroup")) {
        nextPatch.ageGroup = patch.ageGroup ?? null;
      }
      if (hasOwn(patch, "sessionType")) {
        nextPatch.sessionType = patch.sessionType ?? null;
      }
      if (hasOwn(patch, "verified")) {
        nextPatch.verified = patch.verified ?? null;
      }
      if (hasOwn(patch, "page")) {
        nextPatch.page = patch.page && patch.page > 0 ? patch.page : 1;
      }
      if (hasOwn(patch, "limit")) {
        nextPatch.limit = patch.limit && patch.limit > 0 ? patch.limit : 12;
      }

      if (!hasPathBackedLocationScope) {
        setFilters(nextPatch);
        return;
      }

      const nextProvince =
        nextPatch.province !== undefined
          ? normalizeLocationValue(nextPatch.province)
          : normalizeLocationValue(
              filters.province ?? options.initialFilters?.province,
            );
      const nextCity =
        nextPatch.city !== undefined
          ? normalizeLocationValue(nextPatch.city)
          : normalizeLocationValue(
              filters.city ?? options.initialFilters?.city,
            );
      const nextSportId =
        nextPatch.sportId !== undefined
          ? normalizeLocationValue(nextPatch.sportId)
          : normalizeLocationValue(
              filters.sportId ?? options.initialFilters?.sportId,
            );
      const baseParams = new URLSearchParams(searchParams.toString());
      const { pathname: nextPathname, retainedLocationQuery } =
        buildCoachDiscoveryLocationPath({
          location: {
            province: nextProvince,
            city: nextCity,
            sportId: nextSportId,
          },
          sports: options.sports,
        });

      serializeValue(
        baseParams,
        "q",
        nextPatch.q !== undefined ? nextPatch.q : filters.q,
      );
      serializeValue(
        baseParams,
        "minRate",
        nextPatch.minRate !== undefined ? nextPatch.minRate : filters.minRate,
      );
      serializeValue(
        baseParams,
        "maxRate",
        nextPatch.maxRate !== undefined ? nextPatch.maxRate : filters.maxRate,
      );
      serializeValue(
        baseParams,
        "minRating",
        nextPatch.minRating !== undefined
          ? nextPatch.minRating
          : filters.minRating,
      );
      serializeValue(
        baseParams,
        "skillLevel",
        nextPatch.skillLevel !== undefined
          ? nextPatch.skillLevel
          : filters.skillLevel,
      );
      serializeValue(
        baseParams,
        "ageGroup",
        nextPatch.ageGroup !== undefined
          ? nextPatch.ageGroup
          : filters.ageGroup,
      );
      serializeValue(
        baseParams,
        "sessionType",
        nextPatch.sessionType !== undefined
          ? nextPatch.sessionType
          : filters.sessionType,
      );
      serializeValue(
        baseParams,
        "verified",
        nextPatch.verified !== undefined
          ? nextPatch.verified
          : filters.verified,
      );
      serializeValue(
        baseParams,
        "page",
        nextPatch.page !== undefined ? nextPatch.page : filters.page,
      );
      serializeValue(
        baseParams,
        "limit",
        nextPatch.limit !== undefined ? nextPatch.limit : filters.limit,
      );

      baseParams.delete("province");
      baseParams.delete("city");
      baseParams.delete("sportId");

      if (retainedLocationQuery.sportId) {
        baseParams.set("sportId", retainedLocationQuery.sportId);
      }

      const nextQueryString = baseParams.toString();
      const nextUrl = nextQueryString
        ? `${nextPathname}?${nextQueryString}`
        : nextPathname;

      startTransition(() => {
        if (nextPathname !== pathname) {
          requestSkipNextRouteScroll();
        }

        router.replace(nextUrl, { scroll: false });
      });
    },
    [
      filters,
      hasPathBackedLocationScope,
      options.initialFilters,
      options.sports,
      pathname,
      router,
      searchParams,
      setFilters,
    ],
  );

  const clearAll = useCallback(() => {
    commitFilters({
      q: null,
      province: hasPathBackedLocationScope ? undefined : null,
      city:
        locationRouteScope === "city" || locationRouteScope === "sport"
          ? undefined
          : null,
      sportId: locationRouteScope === "sport" ? undefined : null,
      minRate: null,
      maxRate: null,
      minRating: null,
      skillLevel: null,
      ageGroup: null,
      sessionType: null,
      verified: null,
      page: 1,
    });
  }, [commitFilters, hasPathBackedLocationScope, locationRouteScope]);

  return {
    ...filters,
    isPending,
    commitFilters,
    clearAll,
    setQuery: (q?: string) =>
      commitFilters({
        q: q ?? null,
        page: 1,
      }),
    setProvince: (province?: string) =>
      commitFilters({
        province: province ?? null,
        city: null,
        page: 1,
      }),
    setCity: (city?: string) =>
      commitFilters({
        city: city ?? null,
        page: 1,
      }),
    setSportId: (sportId?: string) =>
      commitFilters({
        sportId: sportId ?? null,
        page: 1,
      }),
    setMinRate: (minRate?: number | null) =>
      commitFilters({
        minRate: minRate ?? null,
        page: 1,
      }),
    setMaxRate: (maxRate?: number | null) =>
      commitFilters({
        maxRate: maxRate ?? null,
        page: 1,
      }),
    setMinRating: (minRating?: number | null) =>
      commitFilters({
        minRating: minRating ?? null,
        page: 1,
      }),
    setSkillLevel: (skillLevel?: CoachSearchParams["skillLevel"]) =>
      commitFilters({
        skillLevel: skillLevel ?? null,
        page: 1,
      }),
    setAgeGroup: (ageGroup?: CoachSearchParams["ageGroup"]) =>
      commitFilters({
        ageGroup: ageGroup ?? null,
        page: 1,
      }),
    setSessionType: (sessionType?: CoachSearchParams["sessionType"]) =>
      commitFilters({
        sessionType: sessionType ?? null,
        page: 1,
      }),
    setVerified: (verified?: boolean | null) =>
      commitFilters({
        verified: verified ?? null,
        page: 1,
      }),
    setPage: (page: number) =>
      commitFilters({
        page,
      }),
  };
}
