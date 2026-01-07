import { z } from "zod";

export const CreateReservationSchema = z.object({
  timeSlotId: z.string().uuid(),
});

export type CreateReservationDTO = z.infer<typeof CreateReservationSchema>;
