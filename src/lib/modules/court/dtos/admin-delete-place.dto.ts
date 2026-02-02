import { z } from "zod";
import { S } from "@/common/schemas";

export const AdminDeletePlaceSchema = z.object({
  placeId: S.ids.placeId,
});

export type AdminDeletePlaceDTO = z.infer<typeof AdminDeletePlaceSchema>;
