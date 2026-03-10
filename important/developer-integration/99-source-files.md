# Developer Integration Source Files

## Dashboard Setup Surface

- `src/app/(owner)/organization/developers/page.tsx`
- `src/features/developers/pages/organization-developers-page.tsx`
- `src/features/developers/api.ts`
- `src/features/developers/hooks.ts`
- `src/features/developers/helpers.ts`
- `src/features/developers/schemas.ts`

## Owner Route Handlers

- `src/app/api/organization/organizations/[organizationId]/developer-integrations/route.ts`
- `src/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/keys/route.ts`
- `src/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/court-mappings/route.ts`
- `src/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/precheck/route.ts`
- `src/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/test-console/availability/route.ts`
- `src/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/courts/[courtId]/mapping/route.ts`

## Public Developer API

- `src/app/api/developer/v1/courts/[externalCourtId]/availability/route.ts`
- `src/app/api/developer/v1/courts/[externalCourtId]/unavailability/[externalWindowId]/route.ts`
- `src/lib/modules/developer-integration/dtos/developer-integration.dto.ts`
- `src/lib/modules/developer-integration/services/developer-integration.service.ts`

## Guide Surfaces

- `src/features/guides/components/developer-guide-content.ts`
- `src/features/guides/components/developer-guide-snippets.tsx`
- `src/features/guides/content/guides.ts`

## Tests

- `src/__tests__/features/developers/api.test.ts`
- `src/__tests__/features/developers/helpers.test.ts`
- `src/__tests__/app/api/organization/organizations/[organizationId]/developer-integrations/route.test.ts`
- `src/__tests__/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/keys/route.test.ts`
- `src/__tests__/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/court-mappings/route.test.ts`
- `src/__tests__/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/precheck/route.test.ts`
- `src/__tests__/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/test-console/availability/route.test.ts`
- `src/__tests__/app/api/developer/v1/courts/[externalCourtId]/availability/route.test.ts`
- `src/__tests__/app/api/developer/v1/courts/[externalCourtId]/unavailability/[externalWindowId]/route.test.ts`
