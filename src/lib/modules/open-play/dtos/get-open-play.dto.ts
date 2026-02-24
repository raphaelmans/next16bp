import { z } from "zod";
import { S } from "@/common/schemas";

export const GetOpenPlaySchema = z.object({
  openPlayId: S.ids.generic,
});

export type GetOpenPlayDTO = z.infer<typeof GetOpenPlaySchema>;

export const GetOpenPlayForReservationSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type GetOpenPlayForReservationDTO = z.infer<
  typeof GetOpenPlayForReservationSchema
>;

export const GetOpenPlayForReservationGroupSchema = z.object({
  reservationGroupId: S.ids.generic,
});

export type GetOpenPlayForReservationGroupDTO = z.infer<
  typeof GetOpenPlayForReservationGroupSchema
>;
