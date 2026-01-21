import { z } from "zod";

export const TransferPlaceSchema = z.object({
  placeId: z.string().uuid(),
  targetOrganizationId: z.string().uuid(),
  autoVerifyAndEnable: z.boolean().default(true),
});

export type TransferPlaceDTO = z.infer<typeof TransferPlaceSchema>;
