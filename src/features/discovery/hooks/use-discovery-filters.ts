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
      sportId: null,
      page: 1,
    });
  };

  const setCity = (city: string | undefined) => {
    setFilters({ city: city || null, page: 1 });
  };

  const setSportId = (sportId: string | undefined) => {
    setFilters({ sportId: sportId || null, page: 1 });
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
    setSportId,
    setView,
    setPage,
    setQuery,
    clearAll,
  };
}
