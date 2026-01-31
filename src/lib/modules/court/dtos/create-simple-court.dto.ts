import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for creating a court with simplified fields (UI onboarding flow)
 * This is a simplified version for quick court creation during organization onboarding.
 * Coordinates default to 0,0 and can be updated later.
 */
export const CreateSimpleCourtSchema = z.object({
  organizationId: S.ids.organizationId,
  name: S.court.simpleName,
  address: S.place.address,
  city: S.place.city,
  description: S.court.description,
  defaultPriceCents: S.pricing.priceCents.nullish(),
  currency: S.common.currency.default("PHP"),
});

export type CreateSimpleCourtDTO = z.infer<typeof CreateSimpleCourtSchema>;
