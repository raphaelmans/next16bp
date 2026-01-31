import { z } from "zod";
import { S } from "@/common/schemas";

export const ListPlaceVerificationRequestsSchema = z.object({
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type ListPlaceVerificationRequestsDTO = z.infer<
  typeof ListPlaceVerificationRequestsSchema
>;
