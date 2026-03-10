"use client";

import { z } from "zod";
import { createResponseSchema } from "@/lib/shared/kernel/response";

const developersStatusSchema = z.enum(["PASS", "WARN", "FAIL"]);
const developerScopeSchema = z.enum([
  "availability.read",
  "availability.write",
]);

export const developerIntegrationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  status: z.string(),
  createdByUserId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const developerApiKeySummarySchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  lastFour: z.string(),
  scopes: z.array(developerScopeSchema),
  allowedIpCidrs: z.array(z.string()),
  status: z.string(),
  expiresAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  lastUsedIp: z.string().nullable(),
  revokedAt: z.string().nullable(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const developerCourtMappingSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  courtId: z.string(),
  externalCourtId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const developerPrecheckCheckSchema = z.object({
  id: z.string(),
  status: developersStatusSchema,
  title: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
});

export const developerPrecheckResultSchema = z.object({
  status: developersStatusSchema,
  checks: z.array(developerPrecheckCheckSchema),
  sample: z.object({
    externalCourtId: z.string().nullable(),
    date: z.string(),
    durationMinutes: z.number().int(),
  }),
});

export const developerAvailabilityOptionSchema = z
  .object({
    courtId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string(),
    unavailableReason: z.string().nullable().optional(),
    totalPriceCents: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
  })
  .passthrough();

export const developerAvailabilityResultSchema = z.object({
  options: z.array(developerAvailabilityOptionSchema),
  diagnostics: z.object({}).passthrough(),
});

export const developerAvailabilityTestResultSchema = z.object({
  request: z.object({
    externalCourtId: z.string(),
    date: z.string(),
    durationMinutes: z.number().int(),
    includeUnavailable: z.boolean().optional(),
  }),
  response: developerAvailabilityResultSchema,
  requestId: z.string(),
});

export const createDeveloperIntegrationInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
});

export const createDeveloperApiKeyInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  scopes: z.array(developerScopeSchema).min(1),
  allowedIpCidrs: z.array(z.string().trim().min(1)).max(32).optional(),
  expiresAt: z.string().optional(),
});

export const upsertDeveloperCourtMappingInputSchema = z.object({
  externalCourtId: z.string().trim().min(1).max(128),
});

export const developerPrecheckInputSchema = z.object({
  keyId: z.string(),
  externalCourtId: z.string().optional(),
  date: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
});

export const developerAvailabilityTestInputSchema = z.object({
  keyId: z.string(),
  externalCourtId: z.string(),
  date: z.string(),
  durationMinutes: z.number().int().positive(),
  includeUnavailable: z.boolean().optional(),
});

export const developerIntegrationsResponseSchema = createResponseSchema(
  z.array(developerIntegrationSchema),
);
export const developerIntegrationResponseSchema = createResponseSchema(
  developerIntegrationSchema,
);
export const developerApiKeysResponseSchema = createResponseSchema(
  z.array(developerApiKeySummarySchema),
);
export const developerApiKeyResponseSchema = createResponseSchema(
  developerApiKeySummarySchema,
);
export const developerCreateApiKeyResponseSchema = createResponseSchema(
  z.object({
    apiKey: developerApiKeySummarySchema,
    secret: z.string(),
  }),
);
export const developerMappingsResponseSchema = createResponseSchema(
  z.array(developerCourtMappingSchema),
);
export const developerMappingResponseSchema = createResponseSchema(
  developerCourtMappingSchema,
);
export const developerPrecheckResponseSchema = createResponseSchema(
  developerPrecheckResultSchema,
);
export const developerAvailabilityTestResponseSchema = createResponseSchema(
  developerAvailabilityTestResultSchema,
);
export const developerSuccessResponseSchema = createResponseSchema(
  z.object({
    success: z.literal(true),
  }),
);

export type DeveloperStatus = z.infer<typeof developersStatusSchema>;
export type DeveloperScope = z.infer<typeof developerScopeSchema>;
export type DeveloperIntegration = z.infer<typeof developerIntegrationSchema>;
export type DeveloperApiKeySummary = z.infer<
  typeof developerApiKeySummarySchema
>;
export type DeveloperCourtMapping = z.infer<typeof developerCourtMappingSchema>;
export type DeveloperPrecheckCheck = z.infer<
  typeof developerPrecheckCheckSchema
>;
export type DeveloperPrecheckResult = z.infer<
  typeof developerPrecheckResultSchema
>;
export type DeveloperAvailabilityResult = z.infer<
  typeof developerAvailabilityResultSchema
>;
export type DeveloperAvailabilityTestResult = z.infer<
  typeof developerAvailabilityTestResultSchema
>;
export type CreateDeveloperIntegrationInput = z.infer<
  typeof createDeveloperIntegrationInputSchema
>;
export type CreateDeveloperApiKeyInput = z.infer<
  typeof createDeveloperApiKeyInputSchema
>;
export type UpsertDeveloperCourtMappingInput = z.infer<
  typeof upsertDeveloperCourtMappingInputSchema
>;
export type DeveloperPrecheckInput = z.infer<
  typeof developerPrecheckInputSchema
>;
export type DeveloperAvailabilityTestInput = z.infer<
  typeof developerAvailabilityTestInputSchema
>;
