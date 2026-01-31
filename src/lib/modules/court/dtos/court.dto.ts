import { z } from "zod";
import { S } from "@/common/schemas";

export const CreateCourtSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  label: S.court.label,
  tierLabel: S.court.tierLabel.nullish(),
});

export const UpdateCourtSchema = z.object({
  courtId: S.ids.courtId,
  sportId: S.ids.sportId.optional(),
  label: S.court.label.optional(),
  tierLabel: S.court.tierLabel.nullish(),
  isActive: z.boolean().optional(),
});

export const GetCourtByIdSchema = z.object({
  courtId: S.ids.courtId,
});

export const ListCourtsByPlaceSchema = z.object({
  placeId: S.ids.placeId,
});

export type CreateCourtDTO = z.infer<typeof CreateCourtSchema>;
export type UpdateCourtDTO = z.infer<typeof UpdateCourtSchema>;
export type GetCourtByIdDTO = z.infer<typeof GetCourtByIdSchema>;
export type ListCourtsByPlaceDTO = z.infer<typeof ListCourtsByPlaceSchema>;
