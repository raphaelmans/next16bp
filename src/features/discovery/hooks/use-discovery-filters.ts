"use client";

import { useQueryStates } from "nuqs";
import { searchParamsSchema } from "../schemas/search-params";

/**
 * Hook to manage discovery filter state via URL
 */
export function useDiscoveryFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsSchema, {
    shallow: false,
  });

  const clearAll = () => {
    setFilters({
      q: null,
      city: null,
      type: null,
      isFree: null,
      amenities: [],
      page: 1,
    });
  };

  const setCity = (city: string | undefined) => {
    setFilters({ city: city || null, page: 1 });
  };

  const setType = (type: "CURATED" | "RESERVABLE" | undefined) => {
    setFilters({ type: type || null, page: 1 });
  };

  const setIsFree = (isFree: boolean | undefined) => {
    setFilters({ isFree: isFree ?? null, page: 1 });
  };

  const setAmenities = (amenities: string[]) => {
    setFilters({ amenities, page: 1 });
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
    setCity,
    setType,
    setIsFree,
    setAmenities,
    setView,
    setPage,
    setQuery,
    clearAll,
  };
}
