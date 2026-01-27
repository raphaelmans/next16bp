import { z } from "zod";
import { S, V } from "@/shared/kernel/schemas";

/**
 * Court type enum values for filtering
 */
const CourtTypeFilterEnum = z.enum(["CURATED", "RESERVABLE"], {
  error: V.court.type.invalid.message,
});

/**
 * Schema for searching courts with filters
 */
export const SearchCourtsSchema = z.object({
  city: S.place.city.optional(),
  courtType: CourtTypeFilterEnum.optional(),
  isFree: z.boolean().optional(),
  amenities: z.array(S.place.amenity).optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type SearchCourtsDTO = z.infer<typeof SearchCourtsSchema>;

/**
 * Schema for getting a court by ID
 */
export const GetCourtByIdSchema = z.object({
  id: S.ids.generic,
});

export type GetCourtByIdDTO = z.infer<typeof GetCourtByIdSchema>;

/**
 * Schema for listing courts by city
 */
export const ListCourtsByCitySchema = z.object({
  city: S.place.city,
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type ListCourtsByCityDTO = z.infer<typeof ListCourtsByCitySchema>;
