import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

// ============================================================================
// From search-params.ts
// ============================================================================

export const searchParamsSchema = {
  // View mode
  view: parseAsStringLiteral(["list", "map"] as const).withDefault("list"),

  // Search query
  q: parseAsString,

  // Filters
  province: parseAsString,
  city: parseAsString,
  sportId: parseAsString,
  amenities: parseAsArrayOf(parseAsString),
  verification: parseAsStringLiteral([
    "verified_reservable",
    "curated",
    "unverified_reservable",
  ] as const),

  // Pagination
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
};

export const searchParamsCache = createSearchParamsCache(searchParamsSchema);

export type SearchParams = {
  view: "list" | "map";
  q: string | null;
  province: string | null;
  city: string | null;
  sportId: string | null;
  amenities: string[] | null;
  verification:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable"
    | null;
  page: number;
  limit: number;
};
