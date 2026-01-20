import { z } from "zod";

export const GetPlaceVerificationByIdSchema = z.object({
  id: z.string().uuid(),
});

export type GetPlaceVerificationByIdDTO = z.infer<
  typeof GetPlaceVerificationByIdSchema
>;

export const GetPlaceVerificationByPlaceSchema = z.object({
  placeId: z.string().uuid(),
});

export type GetPlaceVerificationByPlaceDTO = z.infer<
  typeof GetPlaceVerificationByPlaceSchema
>;
