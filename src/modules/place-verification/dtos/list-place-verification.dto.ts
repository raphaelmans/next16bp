import { z } from "zod";

export const ListPlaceVerificationRequestsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ListPlaceVerificationRequestsDTO = z.infer<
  typeof ListPlaceVerificationRequestsSchema
>;
