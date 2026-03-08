"use client";

import { useQueryStates } from "nuqs";
import { adminCourtsSearchParams } from "../schemas/admin-courts-search-params";

/**
 * URL-driven filter state for the admin courts list.
 * Filters persist in the URL — back/forward navigation preserves them
 * and the query hook receives stable references, avoiding redundant fetches.
 */
export function useModAdminCourtFilters() {
  const [filters, setFilters] = useQueryStates(adminCourtsSearchParams, {
    shallow: false,
  });

  const setType = (value: string) =>
    setFilters({
      type: value === "all" ? null : (value as "curated" | "reservable"),
      page: 1,
    });

  const setStatus = (value: string) =>
    setFilters({
      status: value === "all" ? null : (value as "active" | "inactive"),
      page: 1,
    });

  const setProvince = (value: string) =>
    setFilters({ province: value === "all" ? null : value, city: null, page: 1 });

  const setCity = (value: string) =>
    setFilters({ city: value === "all" ? null : value, page: 1 });

  const setClaimStatus = (value: string) =>
    setFilters({
      claimStatus:
        value === "all"
          ? null
          : (value as
              | "unclaimed"
              | "claim_pending"
              | "claimed"
              | "removal_requested"),
      page: 1,
    });

  const setFeatured = (value: string) =>
    setFilters({
      featured:
        value === "all" ? null : (value as "featured" | "not_featured"),
      page: 1,
    });

  const setSource = (value: string) =>
    setFilters({
      source:
        value === "all"
          ? null
          : (value as "user_submitted" | "admin_curated"),
      page: 1,
    });

  const setSortBy = (value: string) =>
    setFilters({
      sortBy: value as "name" | "city" | "createdAt" | "status",
      page: 1,
    });

  const setSortOrder = (value: string) =>
    setFilters({ sortOrder: value as "asc" | "desc" });

  const setSearch = (value: string) =>
    setFilters({ search: value || null, page: 1 });

  const setPage = (value: number) => setFilters({ page: value });

  const handleSort = (column: "name" | "city" | "createdAt" | "status") => {
    if (filters.sortBy === column) {
      setFilters({
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
        page: 1,
      });
    } else {
      setFilters({ sortBy: column, sortOrder: "asc", page: 1 });
    }
  };

  return {
    // Values — null means "all"
    type: filters.type ?? "all",
    status: filters.status ?? "all",
    province: filters.province ?? "all",
    city: filters.city ?? "all",
    claimStatus: filters.claimStatus ?? "all",
    featured: filters.featured ?? "all",
    source: filters.source ?? "all",
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    search: filters.search ?? "",
    page: filters.page,

    // Setters
    setType,
    setStatus,
    setProvince,
    setCity,
    setClaimStatus,
    setFeatured,
    setSource,
    setSortBy,
    setSortOrder,
    setSearch,
    setPage,
    handleSort,
  };
}
