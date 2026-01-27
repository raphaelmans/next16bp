import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const courtFormSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  label: S.court.label,
  tierLabel: S.court.tierLabel.nullable(),
  isActive: z.boolean().default(true),
});

export type CourtFormData = z.infer<typeof courtFormSchema>;

export const defaultCourtFormValues: Partial<CourtFormData> = {
  isActive: true,
};
