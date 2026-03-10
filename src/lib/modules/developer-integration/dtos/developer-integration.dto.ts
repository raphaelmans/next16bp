import { z } from "zod";
import { S } from "@/common/schemas";

const externalIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ipAllowlistPattern = /^[A-Za-z0-9.:/]+$/;

const ExternalIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(externalIdPattern, {
    error:
      "External identifiers may only contain letters, numbers, dots, colons, underscores, and dashes.",
  });

const ExternalReasonSchema = z.string().trim().max(255).optional();

export const DeveloperApiKeyScopeSchema = z.enum([
  "availability.read",
  "availability.write",
]);

const DeveloperApiKeyScopesSchema = z
  .array(DeveloperApiKeyScopeSchema)
  .min(1)
  .max(8)
  .transform((value) => Array.from(new Set(value)));

const AllowedIpCidrsSchema = z
  .array(
    z.string().trim().min(1).max(64).regex(ipAllowlistPattern, {
      error: "IP allowlist entries must be IP addresses or CIDR strings.",
    }),
  )
  .max(32)
  .transform((value) => Array.from(new Set(value)));

export const ListDeveloperIntegrationsSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const CreateDeveloperIntegrationSchema = z.object({
  organizationId: S.ids.organizationId,
  name: z.string().trim().min(1).max(160),
});

export const ListDeveloperApiKeysSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
});

export const ListDeveloperCourtMappingsSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
});

export const CreateDeveloperApiKeySchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  name: z.string().trim().min(1).max(160),
  scopes: DeveloperApiKeyScopesSchema,
  allowedIpCidrs: AllowedIpCidrsSchema.optional(),
  expiresAt: S.common.isoDateTime.optional(),
});

export const RevokeDeveloperApiKeySchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  keyId: S.ids.generic,
});

export const UpsertDeveloperCourtMappingSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  courtId: S.ids.courtId,
  externalCourtId: ExternalIdSchema,
});

export const RemoveDeveloperCourtMappingSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  courtId: S.ids.courtId,
});

export const GetDeveloperAvailabilitySchema = z.object({
  externalCourtId: ExternalIdSchema,
  date: S.common.isoDateTime,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
});

export const RunDeveloperPrecheckSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  keyId: S.ids.generic,
  externalCourtId: ExternalIdSchema.optional(),
  date: S.common.isoDateTime.optional(),
  durationMinutes: S.availability.durationMinutes.optional(),
});

export const RunDeveloperAvailabilityTestSchema = z.object({
  organizationId: S.ids.organizationId,
  integrationId: S.ids.generic,
  keyId: S.ids.generic,
  externalCourtId: ExternalIdSchema,
  date: S.common.isoDateTime,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
});

export const RunDeveloperAvailabilityConsoleSchema =
  RunDeveloperAvailabilityTestSchema;

export const UpsertDeveloperUnavailabilitySchema = z.object({
  externalCourtId: ExternalIdSchema,
  externalWindowId: ExternalIdSchema,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
  reason: ExternalReasonSchema,
});

export const DeleteDeveloperUnavailabilitySchema = z.object({
  externalCourtId: ExternalIdSchema,
  externalWindowId: ExternalIdSchema,
});

export type DeveloperApiKeyScope = z.infer<typeof DeveloperApiKeyScopeSchema>;
export type ListDeveloperIntegrationsDTO = z.infer<
  typeof ListDeveloperIntegrationsSchema
>;
export type CreateDeveloperIntegrationDTO = z.infer<
  typeof CreateDeveloperIntegrationSchema
>;
export type ListDeveloperApiKeysDTO = z.infer<
  typeof ListDeveloperApiKeysSchema
>;
export type ListDeveloperCourtMappingsDTO = z.infer<
  typeof ListDeveloperCourtMappingsSchema
>;
export type CreateDeveloperApiKeyDTO = z.infer<
  typeof CreateDeveloperApiKeySchema
>;
export type RevokeDeveloperApiKeyDTO = z.infer<
  typeof RevokeDeveloperApiKeySchema
>;
export type UpsertDeveloperCourtMappingDTO = z.infer<
  typeof UpsertDeveloperCourtMappingSchema
>;
export type RemoveDeveloperCourtMappingDTO = z.infer<
  typeof RemoveDeveloperCourtMappingSchema
>;
export type GetDeveloperAvailabilityDTO = z.infer<
  typeof GetDeveloperAvailabilitySchema
>;
export type RunDeveloperPrecheckDTO = z.infer<
  typeof RunDeveloperPrecheckSchema
>;
export type RunDeveloperAvailabilityTestDTO = z.infer<
  typeof RunDeveloperAvailabilityTestSchema
>;
export type RunDeveloperAvailabilityConsoleDTO = z.infer<
  typeof RunDeveloperAvailabilityConsoleSchema
>;
export type UpsertDeveloperUnavailabilityDTO = z.infer<
  typeof UpsertDeveloperUnavailabilitySchema
>;
export type DeleteDeveloperUnavailabilityDTO = z.infer<
  typeof DeleteDeveloperUnavailabilitySchema
>;
