import { z } from "zod";

/**
 * Court type enum values for filtering
 */
const CourtTypeFilterEnum = z.enum(["CURATED", "RESERVABLE"]);

/**
 * Schema for searching courts with filters
 */
export const SearchCourtsSchema = z.object({
  city: z.string().optional(),
  courtType: CourtTypeFilterEnum.optional(),
  isFree: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchCourtsDTO = z.infer<typeof SearchCourtsSchema>;

/**
 * Schema for getting a court by ID
 */
export const GetCourtByIdSchema = z.object({
  id: z.string().uuid(),
});

export type GetCourtByIdDTO = z.infer<typeof GetCourtByIdSchema>;

/**
 * Schema for listing courts by city
 */
export const ListCourtsByCitySchema = z.object({
  city: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ListCourtsByCityDTO = z.infer<typeof ListCourtsByCitySchema>;
