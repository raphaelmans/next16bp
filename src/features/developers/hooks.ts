"use client";

import { useEffect, useState } from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
  useFeatureQueryCache,
} from "@/common/feature-api-hooks";
import { getDevelopersApi } from "./api.runtime";

const developersApi = getDevelopersApi();

const developersPaths = {
  integrations: ["developers", "integrations"] as const,
  apiKeys: ["developers", "apiKeys"] as const,
  mappings: ["developers", "mappings"] as const,
};

export function useQueryDevelopersIntegrations(organizationId?: string | null) {
  return useFeatureQuery(
    developersPaths.integrations,
    (input?: { organizationId: string }) =>
      developersApi.listIntegrations({
        organizationId: input?.organizationId ?? "",
      }),
    {
      organizationId: organizationId ?? "",
    },
    { enabled: !!organizationId },
  );
}

export function useQueryDevelopersApiKeys(
  organizationId?: string | null,
  integrationId?: string | null,
) {
  return useFeatureQuery(
    developersPaths.apiKeys,
    (input?: { organizationId: string; integrationId: string }) =>
      developersApi.listApiKeys({
        organizationId: input?.organizationId ?? "",
        integrationId: input?.integrationId ?? "",
      }),
    {
      organizationId: organizationId ?? "",
      integrationId: integrationId ?? "",
    },
    { enabled: !!organizationId && !!integrationId },
  );
}

export function useQueryDevelopersMappings(
  organizationId?: string | null,
  integrationId?: string | null,
) {
  return useFeatureQuery(
    developersPaths.mappings,
    (input?: { organizationId: string; integrationId: string }) =>
      developersApi.listMappings({
        organizationId: input?.organizationId ?? "",
        integrationId: input?.integrationId ?? "",
      }),
    {
      organizationId: organizationId ?? "",
      integrationId: integrationId ?? "",
    },
    { enabled: !!organizationId && !!integrationId },
  );
}

export function useMutDevelopersCreateIntegration(organizationId: string) {
  const cache = useFeatureQueryCache();
  return useFeatureMutation(
    (input: { name: string }) =>
      developersApi.createIntegration({ organizationId, input }),
    {
      onSuccess: async () => {
        await cache.invalidate(developersPaths.integrations, {
          organizationId,
        });
      },
    },
  );
}

export function useMutDevelopersCreateApiKey(
  organizationId: string,
  integrationId: string,
) {
  const cache = useFeatureQueryCache();
  return useFeatureMutation(
    (input: {
      name: string;
      scopes: ("availability.read" | "availability.write")[];
      allowedIpCidrs?: string[];
      expiresAt?: string;
    }) =>
      developersApi.createApiKey({
        organizationId,
        integrationId,
        input,
      }),
    {
      onSuccess: async () => {
        await cache.invalidate(developersPaths.apiKeys, {
          organizationId,
          integrationId,
        });
      },
    },
  );
}

export function useMutDevelopersRevokeApiKey(
  organizationId: string,
  integrationId: string,
) {
  const cache = useFeatureQueryCache();
  return useFeatureMutation(
    (input: { keyId: string }) =>
      developersApi.revokeApiKey({
        organizationId,
        integrationId,
        keyId: input.keyId,
      }),
    {
      onSuccess: async () => {
        await cache.invalidate(developersPaths.apiKeys, {
          organizationId,
          integrationId,
        });
      },
    },
  );
}

export function useMutDevelopersUpsertMapping(
  organizationId: string,
  integrationId: string,
) {
  const cache = useFeatureQueryCache();
  return useFeatureMutation(
    (input: { courtId: string; externalCourtId: string }) =>
      developersApi.upsertMapping({
        organizationId,
        integrationId,
        courtId: input.courtId,
        input: { externalCourtId: input.externalCourtId },
      }),
    {
      onSuccess: async () => {
        await cache.invalidate(developersPaths.mappings, {
          organizationId,
          integrationId,
        });
      },
    },
  );
}

export function useMutDevelopersRemoveMapping(
  organizationId: string,
  integrationId: string,
) {
  const cache = useFeatureQueryCache();
  return useFeatureMutation(
    (input: { courtId: string }) =>
      developersApi.removeMapping({
        organizationId,
        integrationId,
        courtId: input.courtId,
      }),
    {
      onSuccess: async () => {
        await cache.invalidate(developersPaths.mappings, {
          organizationId,
          integrationId,
        });
      },
    },
  );
}

export function useMutDevelopersRunPrecheck(
  organizationId: string,
  integrationId: string,
) {
  return useFeatureMutation(
    (input: {
      keyId: string;
      externalCourtId?: string;
      date?: string;
      durationMinutes?: number;
    }) =>
      developersApi.runPrecheck({
        organizationId,
        integrationId,
        input,
      }),
  );
}

export function useMutDevelopersRunAvailabilityTest(
  organizationId: string,
  integrationId: string,
) {
  return useFeatureMutation(
    (input: {
      keyId: string;
      externalCourtId: string;
      date: string;
      durationMinutes: number;
      includeUnavailable?: boolean;
    }) =>
      developersApi.runAvailabilityTest({
        organizationId,
        integrationId,
        input,
      }),
  );
}

export function useModDevelopersSelection(
  integrationIds: string[],
  initialIntegrationId?: string | null,
) {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(initialIntegrationId ?? integrationIds[0] ?? null);

  useEffect(() => {
    if (
      selectedIntegrationId &&
      integrationIds.includes(selectedIntegrationId)
    ) {
      return;
    }

    setSelectedIntegrationId(integrationIds[0] ?? null);
  }, [integrationIds, selectedIntegrationId]);

  return {
    selectedIntegrationId,
    setSelectedIntegrationId,
  };
}
