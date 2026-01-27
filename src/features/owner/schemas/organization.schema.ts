import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

export const organizationSchema = z.object({
  name: S.organization.name,
  slug: S.organization.slug,
  description: S.organization.description.optional(),
  email: allowEmptyString(S.common.email.optional()),
  phone: allowEmptyString(S.common.phone.optional()),
  address: S.organization.address,
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const removalRequestSchema = z.object({
  reason: S.claimRequest.removalReason,
  acknowledgeReservations: z.boolean().refine((val) => val === true, {
    error: V.claimRequest.acknowledgeReservations.message,
  }),
  acknowledgeApproval: z.boolean().refine((val) => val === true, {
    error: V.claimRequest.acknowledgeApproval.message,
  }),
});

export type RemovalRequestFormData = z.infer<typeof removalRequestSchema>;
