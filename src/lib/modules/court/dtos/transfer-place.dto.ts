import { z } from "zod";
import { S } from "@/common/schemas";

export const TransferPlaceSchema = z.object({
  placeId: S.ids.placeId,
  targetOrganizationId: S.ids.organizationId,
  autoVerifyAndEnable: z.boolean().default(true),
});

export type TransferPlaceDTO = z.infer<typeof TransferPlaceSchema>;
