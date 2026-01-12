import { z } from "zod";

export const CreateCourtSchema = z.object({
  placeId: z.string().uuid(),
  sportId: z.string().uuid(),
  label: z.string().min(1).max(100),
  tierLabel: z.string().max(20).optional().nullable(),
});

export const UpdateCourtSchema = z.object({
  courtId: z.string().uuid(),
  sportId: z.string().uuid().optional(),
  label: z.string().min(1).max(100).optional(),
  tierLabel: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GetCourtByIdSchema = z.object({
  courtId: z.string().uuid(),
});

export const ListCourtsByPlaceSchema = z.object({
  placeId: z.string().uuid(),
});

export type CreateCourtDTO = z.infer<typeof CreateCourtSchema>;
export type UpdateCourtDTO = z.infer<typeof UpdateCourtSchema>;
export type GetCourtByIdDTO = z.infer<typeof GetCourtByIdSchema>;
export type ListCourtsByPlaceDTO = z.infer<typeof ListCourtsByPlaceSchema>;
