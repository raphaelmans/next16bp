import { z } from "zod";
import { S } from "@/common/schemas";

export const ListGuestProfilesSchema = z.object({
  organizationId: S.ids.organizationId,
  query: z.string().trim().max(100).optional(),
  limit: S.pagination.limit.default(50),
});

export type ListGuestProfilesDTO = z.infer<typeof ListGuestProfilesSchema>;

export const CreateGuestProfileSchema = z.object({
  organizationId: S.ids.organizationId,
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().max(255).optional(),
  phoneNumber: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateGuestProfileDTO = z.infer<typeof CreateGuestProfileSchema>;
