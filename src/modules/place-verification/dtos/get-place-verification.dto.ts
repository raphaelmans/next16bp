import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const GetPlaceVerificationByIdSchema = z.object({
  id: S.ids.requestId,
});

export type GetPlaceVerificationByIdDTO = z.infer<
  typeof GetPlaceVerificationByIdSchema
>;

export const GetPlaceVerificationByPlaceSchema = z.object({
  placeId: S.ids.placeId,
});

export type GetPlaceVerificationByPlaceDTO = z.infer<
  typeof GetPlaceVerificationByPlaceSchema
>;
