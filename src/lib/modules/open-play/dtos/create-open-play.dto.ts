import { z } from "zod";
import { S } from "@/common/schemas";

export const CreateOpenPlayFromReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  maxPlayers: z.number().int().min(2).max(32).default(4),
  joinPolicy: z.enum(["REQUEST", "AUTO"]).default("REQUEST"),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).default("PUBLIC"),
  title: z.string().trim().max(80).optional(),
  note: z.string().trim().max(2000).optional(),
  paymentInstructions: z.string().trim().max(2000).optional(),
  paymentLinkUrl: z
    .string()
    .trim()
    .max(500)
    .check(z.url({ error: "Enter a valid URL." }))
    .optional(),
});

export type CreateOpenPlayFromReservationDTO = z.infer<
  typeof CreateOpenPlayFromReservationSchema
>;
