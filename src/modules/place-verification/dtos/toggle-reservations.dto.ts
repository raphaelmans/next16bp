import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const TogglePlaceReservationsSchema = z.object({
  placeId: S.ids.placeId,
  enabled: z.boolean(),
});

export type TogglePlaceReservationsDTO = z.infer<
  typeof TogglePlaceReservationsSchema
>;
