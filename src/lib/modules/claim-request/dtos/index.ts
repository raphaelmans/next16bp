export * from "./approve-claim-request.dto";
export * from "./reject-claim-request.dto";
export * from "./submit-claim-request.dto";
export * from "./submit-guest-removal-request.dto";
export * from "./submit-removal-request.dto";

import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for getting a claim request by ID
 */
export const GetClaimRequestByIdSchema = z.object({
  id: S.ids.requestId,
});

export type GetClaimRequestByIdDTO = z.infer<typeof GetClaimRequestByIdSchema>;

/**
 * Schema for cancelling a claim request
 */
export const CancelClaimRequestSchema = z.object({
  requestId: S.ids.requestId,
});

export type CancelClaimRequestDTO = z.infer<typeof CancelClaimRequestSchema>;

/**
 * Schema for listing pending claims (admin)
 */
export const ListPendingClaimsSchema = z.object({
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type ListPendingClaimsDTO = z.infer<typeof ListPendingClaimsSchema>;
