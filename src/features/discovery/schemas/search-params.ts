import {
  parseAsString,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  parseAsArrayOf,
  createSearchParamsCache,
} from "nuqs/server";

export const searchParamsSchema = {
  // View mode
  view: parseAsStringLiteral(["list", "map"] as const).withDefault("list"),

  // Search query
  q: parseAsString,

  // Filters
  city: parseAsString,
  type: parseAsStringLiteral(["CURATED", "RESERVABLE"] as const),
  isFree: parseAsBoolean,
  amenities: parseAsArrayOf(parseAsString).withDefault([]),

  // Pagination
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
};

export const searchParamsCache = createSearchParamsCache(searchParamsSchema);

export type SearchParams = {
  view: "list" | "map";
  q: string | null;
  city: string | null;
  type: "CURATED" | "RESERVABLE" | null;
  isFree: boolean | null;
  amenities: string[];
  page: number;
  limit: number;
};
