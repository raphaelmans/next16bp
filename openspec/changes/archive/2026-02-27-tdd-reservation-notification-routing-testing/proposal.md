## Why

Reservation notification routing is a core product differentiator and depends on RBAC eligibility plus multi-channel fanout behavior. We need stronger regression coverage for routing preference state, recipient derivation, and delivery fanout/muted paths.

## What Changes

- Expand service-layer tests for `NotificationDeliveryService` reservation lifecycle events:
  - owner and player event fanout
  - group and single event parity
  - muted/no-recipient behavior
  - idempotency-key consistency and inbox side effects
- Expand organization-member routing tests for notification preference and eligible recipient derivation.
- Add/expand owner notification routing UI state and interaction tests:
  - routing settings component loading/saving/error states
  - permission hint and muted-warning visibility conditions
- Maintain deterministic test boundaries with mocked push/email/sms infrastructure.

## Capabilities

### New Capabilities
- `reservation-notification-routing-testing`: Defines required behavioral coverage for reservation notification routing preferences, recipient derivation, and multi-channel fanout contracts.

### Modified Capabilities
- None.

## Impact

- Affected server modules:
  - `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
  - `src/lib/modules/organization-member/services/organization-member.service.ts`
- Affected client modules:
  - `src/features/owner/components/reservation-notification-routing-settings.tsx`
  - `src/features/owner/domain.ts`
- Affected tests (new/expanded):
  - `src/__tests__/modules/notification-delivery/notification-delivery.service.test.ts`
  - `src/__tests__/lib/modules/organization-member/services/organization-member.service.test.ts`
  - `src/__tests__/features/owner/components/reservation-notification-routing-settings.test.tsx`
- No API or database schema changes.
