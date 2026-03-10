"use client";

import {
  getOrganizationDevelopersClient,
  type IOrganizationDevelopersClient,
} from "@/common/clients/organization-developers-client";
import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import {
  type CreateDeveloperApiKeyInput,
  type CreateDeveloperIntegrationInput,
  createDeveloperApiKeyInputSchema,
  createDeveloperIntegrationInputSchema,
  type DeveloperApiKeySummary,
  type DeveloperAvailabilityTestInput,
  type DeveloperAvailabilityTestResult,
  type DeveloperCourtMapping,
  type DeveloperIntegration,
  type DeveloperPrecheckInput,
  type DeveloperPrecheckResult,
  developerApiKeyResponseSchema,
  developerApiKeysResponseSchema,
  developerAvailabilityTestInputSchema,
  developerAvailabilityTestResponseSchema,
  developerCreateApiKeyResponseSchema,
  developerIntegrationResponseSchema,
  developerIntegrationsResponseSchema,
  developerMappingResponseSchema,
  developerMappingsResponseSchema,
  developerPrecheckInputSchema,
  developerPrecheckResponseSchema,
  developerSuccessResponseSchema,
  type UpsertDeveloperCourtMappingInput,
  upsertDeveloperCourtMappingInputSchema,
} from "./schemas";

export interface IDevelopersApi {
  listIntegrations(args: {
    organizationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperIntegration[]>;
  createIntegration(args: {
    organizationId: string;
    input: CreateDeveloperIntegrationInput;
  }): Promise<DeveloperIntegration>;
  listApiKeys(args: {
    organizationId: string;
    integrationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperApiKeySummary[]>;
  createApiKey(args: {
    organizationId: string;
    integrationId: string;
    input: CreateDeveloperApiKeyInput;
  }): Promise<{ apiKey: DeveloperApiKeySummary; secret: string }>;
  revokeApiKey(args: {
    organizationId: string;
    integrationId: string;
    keyId: string;
  }): Promise<DeveloperApiKeySummary>;
  listMappings(args: {
    organizationId: string;
    integrationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperCourtMapping[]>;
  upsertMapping(args: {
    organizationId: string;
    integrationId: string;
    courtId: string;
    input: UpsertDeveloperCourtMappingInput;
  }): Promise<DeveloperCourtMapping>;
  removeMapping(args: {
    organizationId: string;
    integrationId: string;
    courtId: string;
  }): Promise<{ success: true }>;
  runPrecheck(args: {
    organizationId: string;
    integrationId: string;
    input: DeveloperPrecheckInput;
  }): Promise<DeveloperPrecheckResult>;
  runAvailabilityTest(args: {
    organizationId: string;
    integrationId: string;
    input: DeveloperAvailabilityTestInput;
  }): Promise<DeveloperAvailabilityTestResult>;
}

export type DevelopersApiDeps = {
  clientApi?: IOrganizationDevelopersClient;
  toAppError?: (err: unknown) => AppError;
};

const getBasePath = (organizationId: string, integrationId?: string) =>
  integrationId
    ? `/api/organization/organizations/${organizationId}/developer-integrations/${integrationId}`
    : `/api/organization/organizations/${organizationId}/developer-integrations`;

export class DevelopersApi implements IDevelopersApi {
  readonly clientApi: IOrganizationDevelopersClient;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: DevelopersApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getOrganizationDevelopersClient();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  async listIntegrations(args: {
    organizationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperIntegration[]> {
    try {
      const result = await this.clientApi.get(
        getBasePath(args.organizationId),
        developerIntegrationsResponseSchema,
        { signal: args.signal },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async createIntegration(args: {
    organizationId: string;
    input: CreateDeveloperIntegrationInput;
  }): Promise<DeveloperIntegration> {
    try {
      const input = createDeveloperIntegrationInputSchema.parse(args.input);
      const result = await this.clientApi.post(
        getBasePath(args.organizationId),
        developerIntegrationResponseSchema,
        { json: input },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async listApiKeys(args: {
    organizationId: string;
    integrationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperApiKeySummary[]> {
    try {
      const result = await this.clientApi.get(
        `${getBasePath(args.organizationId, args.integrationId)}/keys`,
        developerApiKeysResponseSchema,
        { signal: args.signal },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async createApiKey(args: {
    organizationId: string;
    integrationId: string;
    input: CreateDeveloperApiKeyInput;
  }): Promise<{ apiKey: DeveloperApiKeySummary; secret: string }> {
    try {
      const input = createDeveloperApiKeyInputSchema.parse(args.input);
      const result = await this.clientApi.post(
        `${getBasePath(args.organizationId, args.integrationId)}/keys`,
        developerCreateApiKeyResponseSchema,
        { json: input },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async revokeApiKey(args: {
    organizationId: string;
    integrationId: string;
    keyId: string;
  }): Promise<DeveloperApiKeySummary> {
    try {
      const result = await this.clientApi.delete(
        `${getBasePath(args.organizationId, args.integrationId)}/keys/${args.keyId}`,
        developerApiKeyResponseSchema,
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async listMappings(args: {
    organizationId: string;
    integrationId: string;
    signal?: AbortSignal;
  }): Promise<DeveloperCourtMapping[]> {
    try {
      const result = await this.clientApi.get(
        `${getBasePath(args.organizationId, args.integrationId)}/court-mappings`,
        developerMappingsResponseSchema,
        { signal: args.signal },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async upsertMapping(args: {
    organizationId: string;
    integrationId: string;
    courtId: string;
    input: UpsertDeveloperCourtMappingInput;
  }): Promise<DeveloperCourtMapping> {
    try {
      const input = upsertDeveloperCourtMappingInputSchema.parse(args.input);
      const result = await this.clientApi.put(
        `${getBasePath(args.organizationId, args.integrationId)}/courts/${args.courtId}/mapping`,
        developerMappingResponseSchema,
        { json: input },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async removeMapping(args: {
    organizationId: string;
    integrationId: string;
    courtId: string;
  }): Promise<{ success: true }> {
    try {
      const result = await this.clientApi.delete(
        `${getBasePath(args.organizationId, args.integrationId)}/courts/${args.courtId}/mapping`,
        developerSuccessResponseSchema,
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async runPrecheck(args: {
    organizationId: string;
    integrationId: string;
    input: DeveloperPrecheckInput;
  }): Promise<DeveloperPrecheckResult> {
    try {
      const input = developerPrecheckInputSchema.parse(args.input);
      const result = await this.clientApi.post(
        `${getBasePath(args.organizationId, args.integrationId)}/precheck`,
        developerPrecheckResponseSchema,
        { json: input },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }

  async runAvailabilityTest(args: {
    organizationId: string;
    integrationId: string;
    input: DeveloperAvailabilityTestInput;
  }): Promise<DeveloperAvailabilityTestResult> {
    try {
      const input = developerAvailabilityTestInputSchema.parse(args.input);
      const result = await this.clientApi.post(
        `${getBasePath(args.organizationId, args.integrationId)}/test-console/availability`,
        developerAvailabilityTestResponseSchema,
        { json: input },
      );
      return result.data;
    } catch (error) {
      throw this.toAppError(error);
    }
  }
}

export const createDevelopersApi = (deps: DevelopersApiDeps = {}) =>
  new DevelopersApi(deps);

const DEVELOPERS_API_SINGLETON = createDevelopersApi();

export const getDevelopersApi = () => DEVELOPERS_API_SINGLETON;
