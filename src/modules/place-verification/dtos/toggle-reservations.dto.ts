import { z } from "zod";

export const TogglePlaceReservationsSchema = z.object({
  placeId: z.string().uuid(),
  enabled: z.boolean(),
});

export type TogglePlaceReservationsDTO = z.infer<
  typeof TogglePlaceReservationsSchema
>;
