import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParamsSchema = {
  // View mode
  view: parseAsStringLiteral(["list", "map"] as const).withDefault("list"),

  // Search query
  q: parseAsString,

  // Filters
  city: parseAsString,
  sportId: parseAsString,

  // Pagination
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
};

export const searchParamsCache = createSearchParamsCache(searchParamsSchema);

export type SearchParams = {
  view: "list" | "map";
  q: string | null;
  city: string | null;
  sportId: string | null;
  page: number;
  limit: number;
};
