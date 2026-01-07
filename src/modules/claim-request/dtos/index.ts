export * from "./submit-claim-request.dto";
export * from "./submit-removal-request.dto";
export * from "./approve-claim-request.dto";
export * from "./reject-claim-request.dto";

import { z } from "zod";

/**
 * Schema for getting a claim request by ID
 */
export const GetClaimRequestByIdSchema = z.object({
  id: z.string().uuid(),
});

export type GetClaimRequestByIdDTO = z.infer<typeof GetClaimRequestByIdSchema>;

/**
 * Schema for cancelling a claim request
 */
export const CancelClaimRequestSchema = z.object({
  requestId: z.string().uuid(),
});

export type CancelClaimRequestDTO = z.infer<typeof CancelClaimRequestSchema>;

/**
 * Schema for listing pending claims (admin)
 */
export const ListPendingClaimsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ListPendingClaimsDTO = z.infer<typeof ListPendingClaimsSchema>;
