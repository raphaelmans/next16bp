"use client";

import { useQueryStates } from "nuqs";
import { searchParamsSchema } from "../schemas";

/**
 * Hook to manage discovery filter state via URL
 */
export function useModDiscoveryFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsSchema, {
    shallow: false,
  });

  const clearAll = () => {
    setFilters({
      q: null,
      province: null,
      city: null,
      sportId: null,
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
    setFilters({ sportId: sportId || null, page: 1 });
  };

  const setAmenities = (amenities: string[] | undefined) => {
    setFilters({
      amenities: amenities && amenities.length > 0 ? amenities : null,
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
    setProvince,
    setCity,
    setSportId,
    setAmenities,
    setVerification,
    setView,
    setPage,
    setQuery,
    clearAll,
  };
}
