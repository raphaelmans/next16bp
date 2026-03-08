import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const adminCourtsSearchParams = {
  type: parseAsStringLiteral(["curated", "reservable"] as const),
  status: parseAsStringLiteral(["active", "inactive"] as const),
  province: parseAsString,
  city: parseAsString,
  claimStatus: parseAsStringLiteral([
    "unclaimed",
    "claim_pending",
    "claimed",
    "removal_requested",
  ] as const),
  featured: parseAsStringLiteral([
    "featured",
    "not_featured",
  ] as const),
  source: parseAsStringLiteral([
    "user_submitted",
    "admin_curated",
  ] as const),
  sortBy: parseAsStringLiteral([
    "name",
    "city",
    "createdAt",
    "status",
  ] as const).withDefault("createdAt"),
  sortOrder: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  search: parseAsString,
  page: parseAsInteger.withDefault(1),
};
