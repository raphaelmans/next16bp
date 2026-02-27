## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal for `thorough-testing-domain-logic-service-layer`
- [x] 1.2 Create spec delta for `domain-logic-service-testing`
- [x] 1.3 Create design for domain-logic extraction and service test strategy

## 2. Client Domain Logic Extraction

- [x] 2.1 Add `src/features/owner/domain.ts` pure helpers for reservation
      notification routing state derivation
- [x] 2.2 Update owner settings/dashboard notification-routing surfaces to use
      pure domain helpers
- [x] 2.3 Add table-driven tests for owner domain helpers under mirrored
      `src/__tests__/features/owner/domain.test.ts`

## 3. Shared Server Domain Logic Extraction

- [x] 3.1 Add `src/lib/modules/organization-member/shared/domain.ts` pure
      recipient/routing summary helpers
- [x] 3.2 Update `OrganizationMemberService` notification routing methods to use
      shared helper functions
- [x] 3.3 Add table-driven tests for shared organization-member domain helpers
      under mirrored path

## 4. Service-Layer Regression Coverage

- [x] 4.1 Expand `OrganizationMemberService` tests for notification preference
      and routing status branch behavior
- [x] 4.2 Expand `NotificationDeliveryService` tests for owner fan-out job
      generation with multiple recipients
- [x] 4.3 Add muted-path coverage for owner notification flows including ping
      behavior

## 5. Validation

- [x] 5.1 Run targeted Biome checks on changed files
- [x] 5.2 Run targeted Vitest suites for owner domain and server service-layer
      changes
- [x] 5.3 Update task checklist to complete and verify OpenSpec apply readiness
