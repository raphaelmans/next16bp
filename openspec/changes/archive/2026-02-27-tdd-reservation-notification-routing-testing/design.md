## Context

Reservation notification routing combines RBAC eligibility, user preference state, recipient derivation, and multi-channel fanout delivery. This is a core UX and reliability surface requiring stronger contract coverage across server and owner settings UI.

Targeted modules:
- `src/lib/modules/notification-delivery/services/notification-delivery.service.ts`
- `src/lib/modules/organization-member/services/organization-member.service.ts`
- `src/features/owner/components/reservation-notification-routing-settings.tsx`
- `src/features/owner/domain.ts`

## Goals / Non-Goals

**Goals**
- Expand notification delivery tests for single/group reservation lifecycle events.
- Expand routing preference and enabled-recipient derivation coverage.
- Add owner settings routing component interaction tests for loading/saving/error/muted states.

**Non-Goals**
- Replace notification transport providers.
- Introduce new notification channels.

## Decisions

### 1. Server fanout tests assert payload/idempotency behavior
Server tests verify recipient-scoped fanout outcomes, idempotency shape, and muted-path no-op behavior.

### 2. Organization-member service remains eligibility source
Recipient eligibility and opt-in decisions are validated through organization-member service tests.

### 3. Owner routing UI tests focus on behavior, not styling
Component tests assert actionable UI states (toggle disabled, hints/warnings, success/error feedback) using mocked hooks.

## Risks / Trade-offs

- Notification fanout surfaces can be noisy to assert; tests should validate behavioral invariants rather than over-specifying every payload key.
- UI tests can become flaky if asynchronous mutation timing is not awaited correctly.
