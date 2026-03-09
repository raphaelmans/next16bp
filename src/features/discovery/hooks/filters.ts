"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useTransition } from "react";
import { normalizeAmenityValues } from "@/common/amenities";
import { requestSkipNextRouteScroll } from "@/common/providers/route-scroll-manager";
import {
  buildDiscoveryLocationPath,
  type DiscoveryLocationDefaults,
  type DiscoveryLocationRouteScope,
  type DiscoverySportRouteOption,
} from "@/features/discovery/location-routing";
import type { SearchParams } from "../schemas";
import { searchParamsSchema } from "../schemas";

type DiscoveryFiltersPatch = Partial<
  Omit<SearchParams, "view"> & { view: SearchParams["view"] | null }
>;

const serializeValue = (
  params: URLSearchParams,
  key: keyof SearchParams,
  value: SearchParams[keyof SearchParams] | null | undefined,
) => {
  params.delete(key);

  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      params.append(key, entry);
    }
    return;
  }

  if (key === "page" && value === 1) {
    return;
  }

  if (key === "limit" && value === 8) {
    return;
  }

  if (key === "view" && value === "list") {
    return;
  }

  params.set(key, String(value));
};

const normalizeLocationValue = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

type UseModDiscoveryFiltersOptions = {
  initialFilters?: DiscoveryLocationDefaults;
  locationRouteScope?: DiscoveryLocationRouteScope;
  sports?: DiscoverySportRouteOption[];
};

/**
 * Hook to manage discovery filter state via URL.
 */
export function useModDiscoveryFilters(
  options: UseModDiscoveryFiltersOptions = {},
) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(searchParamsSchema, {
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
    (patch: DiscoveryFiltersPatch) => {
      if (!hasPathBackedLocationScope) {
        setFilters(patch);
        return;
      }

      const nextProvince =
        patch.province !== undefined
          ? normalizeLocationValue(patch.province)
          : normalizeLocationValue(
              filters.province ?? options.initialFilters?.province,
            );
      const nextCity =
        patch.city !== undefined
          ? normalizeLocationValue(patch.city)
          : normalizeLocationValue(
              filters.city ?? options.initialFilters?.city,
            );
      const nextSportId =
        patch.sportId !== undefined
          ? normalizeLocationValue(patch.sportId)
          : normalizeLocationValue(
              filters.sportId ?? options.initialFilters?.sportId,
            );
      const baseParams = new URLSearchParams(searchParams.toString());
      const { pathname: nextPathname, retainedLocationQuery } =
        buildDiscoveryLocationPath({
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
        patch.q !== undefined ? patch.q : filters.q,
      );
      serializeValue(
        baseParams,
        "date",
        patch.date !== undefined ? patch.date : filters.date,
      );
      serializeValue(
        baseParams,
        "time",
        patch.time !== undefined ? patch.time : filters.time,
      );
      serializeValue(
        baseParams,
        "amenities",
        patch.amenities !== undefined ? patch.amenities : filters.amenities,
      );
      serializeValue(
        baseParams,
        "verification",
        patch.verification !== undefined
          ? patch.verification
          : filters.verification,
      );
      serializeValue(
        baseParams,
        "page",
        patch.page !== undefined ? patch.page : filters.page,
      );
      serializeValue(
        baseParams,
        "limit",
        patch.limit !== undefined ? patch.limit : filters.limit,
      );
      serializeValue(
        baseParams,
        "view",
        patch.view !== undefined ? patch.view : filters.view,
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

  useEffect(() => {
    if (!filters.date && filters.time) {
      commitFilters({
        time: null,
        page: 1,
      });
    }
  }, [commitFilters, filters.date, filters.time]);

  const clearAll = useCallback(() => {
    commitFilters({
      q: null,
      province: hasPathBackedLocationScope ? undefined : null,
      city:
        locationRouteScope === "city" || locationRouteScope === "sport"
          ? undefined
          : null,
      sportId: locationRouteScope === "sport" ? undefined : null,
      date: null,
      time: null,
      amenities: null,
      verification: null,
      page: 1,
    });
  }, [commitFilters, hasPathBackedLocationScope, locationRouteScope]);

  const setProvince = useCallback(
    (province: string | undefined) => {
      commitFilters({
        province: province ?? null,
        city: province ? undefined : null,
        sportId: province ? undefined : null,
        page: 1,
      });
    },
    [commitFilters],
  );

  const setCity = useCallback(
    (city: string | undefined) => {
      commitFilters({
        city: city ?? null,
        sportId: city ? undefined : null,
        page: 1,
      });
    },
    [commitFilters],
  );

  const setSportId = useCallback(
    (sportId: string | undefined) => {
      commitFilters({
        sportId: sportId ?? null,
        page: 1,
      });
    },
    [commitFilters],
  );

  const setDate = useCallback(
    (date: string | undefined) => {
      commitFilters({
        date: date ?? null,
        time: date ? filters.time : null,
        page: 1,
      });
    },
    [commitFilters, filters.time],
  );

  const setTime = useCallback(
    (time: string[] | undefined) => {
      commitFilters({
        time: time && time.length > 0 ? time : null,
        page: 1,
      });
    },
    [commitFilters],
  );

  const setAmenities = useCallback(
    (amenities: string[] | undefined) => {
      const normalizedAmenities =
        amenities && amenities.length > 0
          ? normalizeAmenityValues(amenities)
          : null;

      commitFilters({
        amenities: normalizedAmenities,
        page: 1,
      });
    },
    [commitFilters],
  );

  const setVerification = useCallback(
    (
      verification:
        | "verified_reservable"
        | "curated"
        | "unverified_reservable"
        | undefined,
    ) => {
      commitFilters({ verification: verification ?? null, page: 1 });
    },
    [commitFilters],
  );

  const setView = useCallback(
    (view: "list" | "map") => {
      commitFilters({ view });
    },
    [commitFilters],
  );

  const setPage = useCallback(
    (page: number) => {
      commitFilters({ page });
    },
    [commitFilters],
  );

  const setQuery = useCallback(
    (q: string) => {
      commitFilters({ q: q || null, page: 1 });
    },
    [commitFilters],
  );

  return {
    ...filters,
    isPending,
    commitFilters,
    setProvince,
    setCity,
    setSportId,
    setDate,
    setTime,
    setAmenities,
    setVerification,
    setView,
    setPage,
    setQuery,
    clearAll,
  };
}
