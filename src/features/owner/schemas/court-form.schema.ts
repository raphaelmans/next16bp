import { z } from "zod";

export const courtFormSchema = z.object({
  placeId: z.string().uuid("Place is required"),
  sportId: z.string().uuid("Sport is required"),
  label: z.string().trim().min(1, "Court label is required").max(100),
  tierLabel: z.string().trim().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CourtFormData = z.infer<typeof courtFormSchema>;

export const defaultCourtFormValues: Partial<CourtFormData> = {
  isActive: true,
};
