"use client";

import { useQueryStates } from "nuqs";
import { useEffect, useTransition } from "react";
import { normalizeAmenityValues } from "@/common/amenities";
import { searchParamsSchema } from "../schemas";

/**
 * Hook to manage discovery filter state via URL
 */
export function useModDiscoveryFilters() {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(searchParamsSchema, {
    shallow: false,
    startTransition,
  });

  useEffect(() => {
    if (!filters.date && filters.time) {
      setFilters({
        time: null,
        page: 1,
      });
    }
  }, [filters.date, filters.time, setFilters]);

  const clearAll = () => {
    setFilters({
      q: null,
      province: null,
      city: null,
      sportId: null,
      date: null,
      time: null,
      amenities: null,
      verification: null,
      page: 1,
    });
  };

  const setProvince = (province: string | undefined) => {
    setFilters({ province: province || null, city: null, page: 1 });
  };

  const setCity = (city: string | undefined) => {
    setFilters({ city: city || null, page: 1 });
  };

  const setSportId = (sportId: string | undefined) => {
    setFilters({
      sportId: sportId || null,
      page: 1,
    });
  };

  const setDate = (date: string | undefined) => {
    setFilters({
      date: date || null,
      time: date ? filters.time : null,
      page: 1,
    });
  };

  const setTime = (time: string[] | undefined) => {
    setFilters({
      time: time && time.length > 0 ? time : null,
      page: 1,
    });
  };

  const setAmenities = (amenities: string[] | undefined) => {
    const normalizedAmenities =
      amenities && amenities.length > 0
        ? normalizeAmenityValues(amenities)
        : null;

    setFilters({
      amenities: normalizedAmenities,
      page: 1,
    });
  };

  const setVerification = (
    verification:
      | "verified_reservable"
      | "curated"
      | "unverified_reservable"
      | undefined,
  ) => {
    setFilters({ verification: verification ?? null, page: 1 });
  };

  const setView = (view: "list" | "map") => {
    setFilters({ view });
  };

  const setPage = (page: number) => {
    setFilters({ page });
  };

  const setQuery = (q: string) => {
    setFilters({ q: q || null, page: 1 });
  };

  return {
    ...filters,
    isPending,
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
